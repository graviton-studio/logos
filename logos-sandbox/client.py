import asyncio
import json
import os
from typing import Optional, Dict, Any, List, Tuple
from contextlib import AsyncExitStack
from datetime import datetime
import tiktoken
from mcp import ClientSession  # type: ignore
from mcp.client.sse import sse_client  # type: ignore
from anthropic import Anthropic
from dotenv import load_dotenv

# Import our logging configuration
from logging_config import setup_logger

# Set up module logger
logger = setup_logger(__name__)

load_dotenv()
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
# MAX_LLM_TURNS_PER_NODE is more relevant for the workflow runner, but can be a general LLM interaction limit here.
MAX_LLM_INTERACTION_TURNS = int(os.getenv("MAX_LLM_INTERACTION_TURNS", "5"))
# Token limits for context management
MAX_CONTEXT_TOKENS = int(
    os.getenv("MAX_CONTEXT_TOKENS", "180000")
)  # Leave buffer for response
MAX_TOOL_RESULT_TOKENS = int(
    os.getenv("MAX_TOOL_RESULT_TOKENS", "50000")
)  # Per tool result


# Custom JSON encoder to handle non-serializable types
class MCPJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        # Handle common types returned by MCP tools that aren't JSON serializable
        # Check for TextContent or similar objects with a 'text' attribute
        if hasattr(obj, "text"):
            return obj.text
        # Check for objects with a '__str__' method
        if hasattr(obj, "__str__"):
            return str(obj)
        # For any other types, use the default behavior
        return super().default(obj)


class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.anthropic = Anthropic()
        self._available_mcp_tools_cache: Optional[List[Dict[str, Any]]] = None
        # Initialize tokenizer for context management
        try:
            self.tokenizer = tiktoken.encoding_for_model(
                "gpt-4"
            )  # Use GPT-4 tokenizer as proxy
        except Exception:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")  # Fallback

    async def connect_to_sse_server(self, server_url: str):
        """Connect to an MCP server running with SSE transport."""
        # Add API key authentication headers
        headers = {}
        mcp_api_key = os.getenv("MCP_API_KEY")
        if mcp_api_key:
            headers["Authorization"] = f"Bearer {mcp_api_key}"
            logger.info("Added API key authentication for MCP Gateway")
        else:
            logger.warning("No MCP_API_KEY found - connecting without authentication")

        self._streams_context = sse_client(url=server_url, headers=headers)
        streams = await self._streams_context.__aenter__()
        self._session_context = ClientSession(*streams)
        self.session = await self._session_context.__aenter__()
        await self.session.initialize()
        logger.info("Initialized SSE client session.")
        await self._cache_available_mcp_tools()

    async def _cache_available_mcp_tools(self):
        if not self.session:
            logger.error("Session not initialized to cache tools.")
            self._available_mcp_tools_cache = []
            return
        try:
            response = await self.session.list_tools()
            self._available_mcp_tools_cache = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.inputSchema,  # Ensure this matches actual attribute name
                }
                for tool in response.tools
            ]
            tool_names = [tool["name"] for tool in self._available_mcp_tools_cache]
            logger.info(
                f"Cached available MCP tools: {tool_names if tool_names else 'No tools found.'}"
            )
        except Exception as e:
            logger.error(f"Error listing/caching MCP tools: {e}")
            self._available_mcp_tools_cache = []

    async def cleanup(self):
        """Properly clean up the session and streams."""
        if (
            hasattr(self, "_session_context") and self._session_context
        ):  # Check if attributes exist
            await self._session_context.__aexit__(None, None, None)
        if hasattr(self, "_streams_context") and self._streams_context:
            await self._streams_context.__aexit__(None, None, None)
        self._available_mcp_tools_cache = None
        logger.info("Session cleaned up.")

    def _safe_serialize(self, obj: Any) -> Any:
        """Safely serialize any object, handling non-serializable types."""
        try:
            # First attempt: use the custom encoder
            return json.loads(json.dumps(obj, cls=MCPJsonEncoder))
        except (TypeError, json.JSONDecodeError):
            # Fallback approach for complex objects
            if hasattr(obj, "text"):
                return obj.text
            elif hasattr(obj, "content") and isinstance(obj.content, str):
                return obj.content
            elif hasattr(obj, "__dict__"):
                # Serialize the object's attributes
                return {
                    key: self._safe_serialize(value)
                    for key, value in obj.__dict__.items()
                    if not key.startswith("_")
                }
            else:
                # Last resort
                return str(obj)

    def _count_tokens(self, text: str) -> int:
        """Count tokens in a text string."""
        try:
            return len(self.tokenizer.encode(text))
        except Exception:
            # Fallback: estimate 4 chars per token
            return len(text) // 4

    async def _summarize_large_content(
        self,
        content: Any,
        max_tokens: int = MAX_TOOL_RESULT_TOKENS,
        tool_name: str = "unknown",
    ) -> str:
        """Intelligently summarize content that exceeds token limits using parallel LLM calls."""
        if content is None:
            return ""

        # Convert to string representation
        if isinstance(content, str):
            text = content
        elif isinstance(content, dict) or isinstance(content, list):
            try:
                text = json.dumps(content, indent=2, default=str)
            except Exception:
                text = str(content)
        else:
            text = str(content)

        # Check token count
        token_count = self._count_tokens(text)

        if token_count <= max_tokens:
            return text

        # Hard limit: refuse to process content over 1M tokens
        if token_count > 1000000:
            error_msg = f"Content from {tool_name} exceeds maximum limit of 1,000,000 tokens ({token_count} tokens). Cannot process."
            logger.error(error_msg)
            raise ValueError(error_msg)

        logger.warning(
            f"Content from {tool_name} exceeds {max_tokens} tokens ({token_count}). Using parallel LLM summarization."
        )

        try:
            # Create summarization prompt based on tool type
            summary_prompts = {
                "list_gmail_messages": "Summarize this email data chunk concisely. Focus on: email count, key senders, date range, urgent emails. Preserve important IDs.",
                "gmail": "Summarize this Gmail data chunk. Include: email count, main participants, date range, key themes. Preserve IDs.",
                "default": f"Concisely summarize this {tool_name} data chunk. Key points only. Preserve IDs and URLs.",
            }

            summary_prompt = summary_prompts.get(tool_name, summary_prompts["default"])

            # Split content into chunks for parallel processing
            chunk_size_chars = 100000  # Approximately 25K tokens per chunk
            chunks = []

            for i in range(0, len(text), chunk_size_chars):
                chunk = text[i : i + chunk_size_chars]
                chunk_tokens = self._count_tokens(chunk)
                if chunk_tokens > 0:  # Only add non-empty chunks
                    chunks.append(chunk)

            logger.info(
                f"Split {token_count} tokens into {len(chunks)} chunks for parallel summarization"
            )

            # Create parallel summarization tasks
            async def summarize_chunk(chunk_text: str, chunk_index: int) -> str:
                try:
                    chunk_tokens = self._count_tokens(chunk_text)
                    response = self.anthropic.messages.create(
                        model=CLAUDE_MODEL,
                        max_tokens=4000,  # Small summary per chunk
                        messages=[
                            {
                                "role": "user",
                                "content": f"{summary_prompt}\n\nChunk {chunk_index + 1} ({chunk_tokens} tokens):\n{chunk_text}",
                            }
                        ],
                    )

                    chunk_summary = ""
                    if response.content:
                        for block in response.content:
                            if hasattr(block, "text"):
                                chunk_summary += block.text

                    return chunk_summary.strip()
                except Exception as e:
                    logger.error(f"Error summarizing chunk {chunk_index}: {e}")
                    return f"[Chunk {chunk_index + 1} summarization failed]"

            # Execute all summarization tasks in parallel
            chunk_summaries = await asyncio.gather(
                *[summarize_chunk(chunk, i) for i, chunk in enumerate(chunks)],
                return_exceptions=True,
            )

            # Combine summaries, handling any exceptions
            combined_summaries = []
            for i, summary in enumerate(chunk_summaries):
                if isinstance(summary, Exception):
                    logger.error(f"Chunk {i} failed: {summary}")
                    combined_summaries.append(f"[Chunk {i + 1} failed to summarize]")
                else:
                    combined_summaries.append(summary)

            # Combine all chunk summaries
            full_summary = "\n\n".join(combined_summaries)

            # Add metadata header
            summary_header = f"[CONTENT SUMMARIZED - Original: {token_count} tokens from {tool_name}, {len(chunks)} chunks]\n\n"
            final_summary = summary_header + full_summary

            # Verify the combined summary fits within limits
            summary_tokens = self._count_tokens(final_summary)
            if summary_tokens > max_tokens:
                logger.warning(
                    f"Combined summary still too long ({summary_tokens} tokens). Further truncating."
                )
                return self._truncate_content_fallback(
                    final_summary, max_tokens, tool_name, summary_tokens
                )

            logger.info(
                f"Successfully summarized {tool_name} output from {token_count} to {summary_tokens} tokens using {len(chunks)} parallel chunks"
            )
            return final_summary

        except Exception as e:
            logger.error(
                f"Error during parallel LLM summarization: {e}. Falling back to truncation."
            )
            return self._truncate_content_fallback(
                text, max_tokens, tool_name, token_count
            )

    def _truncate_content_fallback(
        self, text: str, max_tokens: int, tool_name: str, original_tokens: int
    ) -> str:
        """Fallback truncation method when summarization fails."""
        truncation_msg = f"\n\n[CONTENT TRUNCATED - Original: {original_tokens} tokens from {tool_name}, showing first {max_tokens} tokens]"
        target_tokens = max_tokens - self._count_tokens(truncation_msg)

        # Binary search to find the right truncation point
        chars_per_token = len(text) / original_tokens if original_tokens > 0 else 4
        estimated_chars = int(target_tokens * chars_per_token)

        # Start with estimate and adjust
        truncated = text[:estimated_chars]
        while self._count_tokens(truncated) > target_tokens and len(truncated) > 100:
            truncated = truncated[: int(len(truncated) * 0.9)]

        return truncated + truncation_msg

    async def execute_llm_interaction(
        self,
        system_prompt: str,
        user_messages: List[Dict[str, Any]],
        interaction_id_for_logging: str = "llm_interaction",
    ) -> Tuple[
        str, Dict[str, Any]
    ]:  # Returns (final_text_response, all_tool_outputs_dict)
        """
        Manages a multi-turn interaction with the Anthropic LLM, including handling
        any MCP tool calls requested by the LLM.

        Args:
            system_prompt: The system prompt for the LLM.
            user_messages: A list of user messages to start the conversation.
            interaction_id_for_logging: An identifier for logging purposes.

        Returns:
            A tuple containing:
                - final_text_response (str): The aggregated text response from the LLM.
                - all_tool_outputs (Dict[str, Any]): A dictionary where keys are tool_use_id
                  (or tool_name if ID not available) and values are the content from tool execution.
        """
        if not self._available_mcp_tools_cache:
            logger.info(
                f"[{interaction_id_for_logging}] MCP tools not cached. Attempting to cache."
            )
            await self._cache_available_mcp_tools()

        if not self.session:
            raise ConnectionError(
                f"[{interaction_id_for_logging}] MCP session not initialized. Cannot execute LLM interaction with tools."
            )

        messages = user_messages.copy()
        aggregated_text_responses = []
        all_tool_outputs: Dict[str, Any] = (
            {}
        )  # To store outputs from tools called by LLM

        for turn in range(MAX_LLM_INTERACTION_TURNS):
            logger.info(
                f"[{interaction_id_for_logging}] LLM Interaction Turn {turn + 1}/{MAX_LLM_INTERACTION_TURNS}"
            )

            try:
                # Use a specific tool for structured output if desired for next_node_id
                # For now, focusing on general LLM interaction with MCP tools.
                llm_response = self.anthropic.messages.create(
                    system=system_prompt,
                    model=CLAUDE_MODEL,
                    max_tokens=16000,
                    thinking={"type": "enabled", "budget_tokens": 10000},
                    messages=messages,
                    tools=self._available_mcp_tools_cache or [],
                )
            except Exception as e:
                error_msg = f"Error calling Anthropic API: {e}"
                logger.error(f"[{interaction_id_for_logging}] {error_msg}")
                aggregated_text_responses.append(error_msg)
                break

            assistant_response_blocks = (
                llm_response.content if llm_response.content else []
            )
            messages.append({"role": "assistant", "content": assistant_response_blocks})

            requested_mcp_tool_calls = (
                []
            )  # List of (tool_use_id, tool_name, tool_input)
            has_text_this_turn = False

            for block in assistant_response_blocks:
                if block.type == "text":
                    aggregated_text_responses.append(block.text)
                    has_text_this_turn = True
                    logger.info(
                        f"[{interaction_id_for_logging}] LLM Text: {block.text[:150]}..."
                    )
                elif block.type == "tool_use" and block.name in [
                    tool["name"] for tool in (self._available_mcp_tools_cache or [])
                ]:
                    # Ensure the LLM is trying to use an actual MCP tool we know about
                    requested_mcp_tool_calls.append((block.id, block.name, block.input))
                    logger.info(
                        f"[{interaction_id_for_logging}] LLM requests MCP Tool: {block.name} (ID: {block.id}) with input {block.input}"
                    )
                elif block.type == "tool_use":
                    # LLM tried to use a tool not in our MCP tool list
                    logger.warning(
                        f"[{interaction_id_for_logging}] LLM tried to use tool '{block.name}' which is not an available MCP tool. Ignoring."
                    )
                    # We could optionally send this back as an error to the LLM. For now, we just ignore.

            if (
                not requested_mcp_tool_calls
            ):  # LLM did not request any (known) MCP tools
                if not has_text_this_turn and not aggregated_text_responses:
                    aggregated_text_responses.append(
                        "[LLM interaction ended without text output or MCP tool calls this turn.]"
                    )
                break  # End interaction if no MCP tools are called by LLM

            # Execute requested MCP tools
            tool_results_for_llm_message = []
            for tool_use_id, tool_name, tool_input_args in requested_mcp_tool_calls:
                logger.info(
                    f"[{interaction_id_for_logging}] Executing MCP Tool '{tool_name}' with args: {json.dumps(tool_input_args)}"
                )
                try:
                    mcp_tool_exec_result = await self.session.call_tool(
                        tool_name, tool_input_args
                    )

                    # Safely handle possibly non-serializable tool output content
                    raw_tool_output = mcp_tool_exec_result.content
                    serialized_tool_output = self._safe_serialize(raw_tool_output)

                    # Summarize large tool outputs to prevent token limit issues
                    summarized_output = await self._summarize_large_content(
                        serialized_tool_output, MAX_TOOL_RESULT_TOKENS, tool_name
                    )

                    # Store the serialized version for the caller
                    all_tool_outputs[tool_use_id or tool_name] = serialized_tool_output

                    # Debug info about the tool result
                    logger.debug(
                        f"[{interaction_id_for_logging}] Raw tool result type: {type(raw_tool_output).__name__}"
                    )

                    # Format for LLM: Anthropic expects content to be a list of blocks.
                    llm_formatted_tool_content: List[Dict[str, Any]] = []

                    # Handle different types of content based on what we actually got back
                    # Use summarized_output for LLM to prevent token limit issues
                    if isinstance(summarized_output, str):
                        llm_formatted_tool_content.append(
                            {"type": "text", "text": summarized_output}
                        )
                    else:
                        # Convert to string and use truncated version
                        text_content = (
                            json.dumps(summarized_output, default=str)
                            if not isinstance(summarized_output, str)
                            else summarized_output
                        )
                        llm_formatted_tool_content.append(
                            {"type": "text", "text": text_content}
                        )

                    tool_results_for_llm_message.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": llm_formatted_tool_content,
                        }
                    )
                    logger.info(
                        f"[{interaction_id_for_logging}] MCP Tool '{tool_name}' executed. Result sent to LLM."
                    )
                except Exception as e:
                    error_detail = f"Error executing MCP tool {tool_name}: {str(e)}"
                    logger.error(f"[{interaction_id_for_logging}] {error_detail}")
                    all_tool_outputs[tool_use_id or tool_name] = {
                        "error": error_detail
                    }  # Store error for caller
                    tool_results_for_llm_message.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": [{"type": "text", "text": error_detail}],
                            "is_error": True,
                        }
                    )

            if tool_results_for_llm_message:
                messages.append(
                    {"role": "user", "content": tool_results_for_llm_message}
                )
            else:  # Should not happen if requested_mcp_tool_calls was not empty
                logger.warning(
                    f"[{interaction_id_for_logging}] MCP Tool calls were made, but no results generated for LLM."
                )
                break

        if (
            turn == MAX_LLM_INTERACTION_TURNS - 1 and requested_mcp_tool_calls
        ):  # Check last iteration
            aggregated_text_responses.append(
                f"[LLM interaction for {interaction_id_for_logging} reached max turns with pending tool calls.]"
            )

        final_text = "\n".join(aggregated_text_responses).strip()
        if not final_text and not all_tool_outputs:  # If truly nothing happened
            final_text = (
                "[LLM interaction produced no textual output and no tool outputs.]"
            )

        return final_text, all_tool_outputs

    # legacy_process_query is a simplified direct use of execute_llm_interaction
    async def legacy_process_query(self, initial_query_text: str) -> str:
        """
        Processes a single text query using LLM and available MCP tools.
        Returns only the textual part of the LLM's response.
        """
        logger.info(f"Received query: {initial_query_text[:100]}...")
        system_prompt = (
            f"You are a helpful assistant. Today's date is {datetime.now().strftime('%Y-%m-%d')}. "
            "You can use available tools to answer the user's query."
        )
        user_messages = [{"role": "user", "content": initial_query_text}]

        final_text_response, _ = await self.execute_llm_interaction(
            system_prompt, user_messages, interaction_id_for_logging="legacy_query"
        )
        logger.info(f"Final text response: {final_text_response[:100]}...")
        return final_text_response

    async def chat_loop(self):
        """Run an interactive chat loop using legacy_process_query"""
        logger.info(
            "\nMCP Client Interactive Chat (Legacy Mode using execute_llm_interaction)"
        )
        logger.info("Type your queries or 'quit' to exit.")

        if not self.session:
            try:  # Attempt to connect if not already (useful for direct CLI testing)
                if os.getenv("APP_ENV") == "dev":
                    sse_url = os.getenv("MCP_SERVER_DEV_URL")
                else:
                    sse_url = os.getenv("MCP_SERVER_PROD_URL")
                if not sse_url:
                    logger.error(
                        "Error: MCP_SERVER_URL not set. Cannot connect for chat loop."
                    )
                    return
                logger.info(
                    f"Attempting to connect to SSE server at {sse_url} for chat loop..."
                )
                await self.connect_to_sse_server(sse_url)
            except Exception as e:
                logger.error(f"Error connecting for chat loop: {e}")
                return

        if (
            not self._available_mcp_tools_cache
        ):  # Ensure tools are loaded after potential connect
            await self._cache_available_mcp_tools()

        while True:
            try:
                query = input("\nQuery: ").strip()
                if query.lower() == "quit":
                    break
                if not query:
                    continue
                response = await self.legacy_process_query(query)
                print("\nAssistant:\n" + response)
            except KeyboardInterrupt:
                logger.info("\nExiting chat loop...")
                break
            except Exception as e:
                logger.error(f"\nError in chat loop: {str(e)}")
