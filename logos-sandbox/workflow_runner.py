import asyncio
import json
import os
from typing import Dict, Any, List, Optional, Tuple, Set
from datetime import datetime, timezone
import uuid

from client import MCPClient


class WorkflowContext:
    """Simplified context manager for workflow variables."""

    def __init__(self, initial_context: Dict[str, Any] = None):
        self.variables = initial_context.copy() if initial_context else {}
        self.step_outputs = {}  # Track outputs by step for reference

    def set(self, key: str, value: Any):
        """Set a variable in the context."""
        self.variables[key] = value

    def get(self, key: str, default=None):
        """Get a variable from the context."""
        return self.variables.get(key, default)

    def update(self, updates: Dict[str, Any]):
        """Update context with multiple variables."""
        self.variables.update(updates)

    def get_all(self) -> Dict[str, Any]:
        """Get all variables."""
        return self.variables.copy()

    def track_step_output(self, step_index: int, outputs: Dict[str, Any]):
        """Track outputs from a specific step."""
        self.step_outputs[step_index] = outputs
        self.update(outputs)  # Also add to main context


from models import (
    Agent,
    WorkflowStep,
    AgentExecution,
    AgentExecutionLog,
    LogType,
    ExecutionState,
    TriggerType,
)

# Import the new DB client and the function to create the base Supabase client
from utils import SupabaseDBLogClient, create_supabase_client

# Import our logging configuration
from logging_config import setup_logger

# Set up module logger
logger = setup_logger(__name__)

MAX_WORKFLOW_STEPS = int(
    os.getenv("MAX_WORKFLOW_STEPS", "20")
)  # Safeguard against infinite loops


class AgentWorkflowRunner:
    """
    Orchestrates the execution of an Agent's workflow using structured workflow steps
    rather than node graph traversal. This approach simplifies execution by following
    the linear workflow steps defined in the agent's structured instructions.
    """

    def __init__(
        self,
        agent: Agent,
        mcp_client: MCPClient,
        db_client: Optional[SupabaseDBLogClient],
        env: str = "prod",
    ):
        """
        Initialize the workflow runner.

        Args:
            agent: The Agent containing structured instructions with workflow steps
            mcp_client: An initialized MCPClient for interacting with LLM and tools
            db_client: An initialized SupabaseDBLogClient for logging execution data to database.
            env: The environment ('prod' or 'dev').
        """
        if (
            not agent.structured_instructions
            or not agent.structured_instructions.workflow
        ):
            raise ValueError(
                "Agent must have structured_instructions with workflow steps defined"
            )

        self.agent = agent
        self.mcp_client = mcp_client
        self.env = env
        self.db_client = db_client

        if not self.db_client:
            logger.warning(
                f"No db_client provided. Database logging will be skipped for environment: {env}."
            )
        else:
            logger.info(f"Database logging enabled for environment: {env}")

        self.workflow_steps = agent.structured_instructions.workflow

        # For tracking workflow execution
        self.executed_steps: Set[int] = set()
        self.current_step = 0

        # Simplified context management
        self.context = WorkflowContext()

    # Step configuration templates
    STEP_DEFAULTS = {
        "input": {
            "variable_name": "step_{index}_input",
            "default_value": None,
            "output_variable_name": "step_{index}_result",
        },
        "trigger": {
            "output_variable_name": "step_{index}_result",
        },
        "output": {"output_variables": ["step_{index}_result"], "format": None},
        "process": {
            "input_variables": ["step_{prev_index}_result"],
            "output_variable_name": "step_{index}_result",
        },
        "tool": {
            "tool_name": "exa_search",
            "input_mapping": {"query": "step_{prev_index}_result"},
            "output_mapping": {"search_results": "$output"},
        },
        "decision": {
            "condition": "not_empty:step_result",
            "input_variables": ["step_{prev_index}_result"],
        },
        "transform": {
            "transformation": "json_stringify",
            "input_variables": ["step_{prev_index}_result"],
            "output_variable": "step_{index}_result",
        },
    }

    def get_step_config(self, step_index: int) -> Dict[str, Any]:
        """Get configuration for a workflow step based on its position and type."""
        if step_index >= len(self.workflow_steps):
            return {}

        step = self.workflow_steps[step_index]

        # Base config
        config = {"step": step.step, "description": step.description, "type": step.type}

        # Apply defaults with index substitution
        defaults = self.STEP_DEFAULTS.get(step.type, {})
        for key, value in defaults.items():
            if isinstance(value, str):
                # Replace placeholders
                value = value.replace("{index}", str(step_index))
                value = value.replace(
                    "{prev_index}", str(step_index - 1) if step_index > 0 else ""
                )
            elif isinstance(value, list):
                # Handle list values with placeholders
                value = [
                    (
                        item.replace("{index}", str(step_index)).replace(
                            "{prev_index}", str(step_index - 1)
                        )
                        if isinstance(item, str) and step_index > 0
                        else item
                    )
                    for item in value
                    if not (
                        isinstance(item, str)
                        and "{prev_index}" in item
                        and step_index == 0
                    )
                ]
            config[key] = value

        return config

    def get_variable(self, name: str) -> Any:
        """Get a variable from the workflow context."""
        return self.context.get(name)

    def get_all_variables(self) -> Dict[str, Any]:
        """Get all variables from the workflow context."""
        return self.context.get_all()

    async def execute_step(
        self,
        step_index: int,
        execution_id: str,
        current_step_number: int,
    ) -> Tuple[Dict[str, Any], bool]:
        """
        Execute a single workflow step using the LLM or MCP client.

        Args:
            step_index: Index of the step to execute
            context: Current workflow context
            execution_id: ID of the current execution
            current_step_number: Current step number in the workflow

        Returns:
            Tuple of (step_outputs, should_continue)
        """
        if step_index >= len(self.workflow_steps):
            error_msg = (
                f"Step index {step_index} out of range at step {current_step_number}."
            )
            logger.error(error_msg)
            await self._log_event(
                execution_id=execution_id,
                log_type="error",
                content={"message": error_msg, "step_index": step_index},
                step_number=current_step_number,
            )
            raise ValueError(error_msg)

        step = self.workflow_steps[step_index]
        step_id = f"step_{step_index}_{step.step.replace(' ', '_').lower()}"

        await self._log_event(
            execution_id=execution_id,
            log_type="node_execution",
            content={
                "message": "Starting step execution",
                "step_name": step.step,
                "step_type": step.type,
                "step_description": step.description,
            },
            node_id=step_id,
            step_number=current_step_number,
        )

        step_outputs = {}
        should_continue = True

        try:
            config = self.get_step_config(step_index)

            logger.info(
                f"Executing Step {step_index}: '{step.step}' - Type: {step.type} (Step: {current_step_number}, Execution: {execution_id})"
            )

            if step.type == "tool":
                step_outputs = await self._execute_tool_step(
                    step=step,
                    step_index=step_index,
                    config=config,
                    execution_id=execution_id,
                    step_number=current_step_number,
                )
            else:
                step_outputs = await self._execute_step_with_llm(
                    step=step,
                    step_index=step_index,
                    config=config,
                    execution_id=execution_id,
                    step_number=current_step_number,
                )

            # For decision steps, check if we should continue or branch
            if step.type == "decision":
                decision_result = step_outputs.get(
                    f"step_{step_index}_condition_result", True
                )
                if not decision_result:
                    should_continue = False
                    logger.info(
                        f"Decision step {step_index} returned False, stopping workflow"
                    )

            # Track step outputs in context
            self.context.track_step_output(step_index, step_outputs)

            await self._log_event(
                execution_id=execution_id,
                log_type="node_execution",
                content={
                    "message": "Step execution completed",
                    "outputs_keys": list(step_outputs.keys()),
                    "should_continue": should_continue,
                },
                node_id=step_id,
                step_number=current_step_number,
            )
            return step_outputs, should_continue

        except Exception as e:
            error_msg = f"Error executing step {step_index} '{step.step}' (Step: {current_step_number}): {e}"
            logger.error(error_msg, exc_info=True)
            self.context.set(f"step_{step_index}_error", error_msg)

            await self._log_event(
                execution_id=execution_id,
                log_type="error",
                content={"message": error_msg, "exception_type": type(e).__name__},
                node_id=step_id,
                step_number=current_step_number,
            )
            return {
                f"step_{step_index}_error": error_msg,
                f"step_{step_index}_exception_type": type(e).__name__,
            }, False

    async def _execute_tool_step(
        self,
        step: Any,
        step_index: int,
        config: Dict[str, Any],
        execution_id: str,
        step_number: int,
    ) -> Dict[str, Any]:
        """Execute a tool step by directly calling the MCP tool without LLM involvement."""
        outputs = {}
        step_id = f"step_{step_index}_{step.step.replace(' ', '_').lower()}"

        # Resolve tool input arguments from context variables
        resolved_args = {}
        input_mapping = config.get("input_mapping", {})
        context_vars = self.context.get_all()

        for arg_name, context_var_path in input_mapping.items():
            if context_var_path in context_vars:
                resolved_args[arg_name] = context_vars[context_var_path]
            else:
                logger.warning(
                    f"Context variable '{context_var_path}' not found for tool arg '{arg_name}'"
                )

        # Get tool name from config
        tool_name = config.get("tool_name", "exa_search")  # Default tool name

        await self._log_event(
            execution_id=execution_id,
            log_type="tool_call",
            content={
                "message": f"Attempting to call MCP tool '{tool_name}'",
                "tool_name": tool_name,
                "arguments": resolved_args,
            },
            node_id=step_id,
            step_number=step_number,
        )
        logger.info(
            f"Calling MCP tool '{tool_name}' with args: {json.dumps(resolved_args)} (Execution: {execution_id}, Step: {step_index})"
        )
        try:
            if not self.mcp_client.session:
                raise ConnectionError("MCP Client session not available for tool call")

            # Make the actual tool call
            result = await self.mcp_client.session.call_tool(tool_name, resolved_args)
            result_content = result.content

            await self._log_event(
                execution_id=execution_id,
                log_type="tool_result",
                content={
                    "message": f"Tool '{tool_name}' executed successfully",
                    "tool_name": tool_name,
                    "result_preview": str(result_content)[:200],
                },
                node_id=step_id,
                step_number=step_number,
            )
            logger.debug(f"Tool result: {result_content}")

            # Map the tool result to context variables using output_mapping
            output_mapping = config.get("output_mapping", {"search_results": "$output"})
            for context_var, source_path in output_mapping.items():
                if source_path == "$output":  # Special keyword for the entire output
                    outputs[context_var] = result_content
                elif isinstance(result_content, dict) and source_path in result_content:
                    outputs[context_var] = result_content[source_path]
                else:
                    # Fallback - assign whole output
                    outputs[context_var] = result_content
                    logger.info(
                        f"Note: Output mapping key '{source_path}' not found in result. Using entire result."
                    )

        except Exception as e:
            error_msg = f"Error executing tool '{tool_name}': {e}"
            logger.error(error_msg)
            error_key = f"step_{step_index}_error"
            outputs[error_key] = error_msg
            await self._log_event(
                execution_id=execution_id,
                log_type="error",
                content={
                    "message": f"Error executing tool '{tool_name}'",
                    "tool_name": tool_name,
                    "error_details": str(e),
                },
                node_id=step_id,
                step_number=step_number,
            )

        return outputs

    async def _execute_step_with_llm(
        self,
        step: Any,
        step_index: int,
        config: Dict[str, Any],
        execution_id: str,
        step_number: int,
    ) -> Dict[str, Any]:
        """Execute any step type using LLM to determine the logic and outputs."""
        outputs = {}
        step_id = f"step_{step_index}_{step.step.replace(' ', '_').lower()}"

        # Special handling for input steps with default values
        if step.type == "input":
            var_name = config.get("variable_name", f"step_{step_index}_input")
            default_value = config.get("default_value")

            # Only use default value if the variable is not already in context
            if self.context.get(var_name) is None and default_value is not None:
                logger.info(f"Using default value for input variable '{var_name}'")
                outputs[var_name] = default_value
                await self._log_event(
                    execution_id,
                    "info",
                    {
                        "message": f"Input step '{step.step}' used default value for '{var_name}'"
                    },
                    step_id,
                    step_number,
                )
                return outputs

        # Special handling for decision steps with simple conditions
        if step.type == "decision":
            condition = config.get("condition", "not_empty:step_result")
            input_variables = config.get("input_variables", [])

            # Parse the condition if it's a standard format like "not_empty:variable_name"
            try:
                condition_parts = condition.split(":")
                if len(condition_parts) == 2:
                    condition_type = condition_parts[0]
                    variable_name = condition_parts[1]

                    # Apply the condition logic
                    variable_value = self.context.get(variable_name)
                    if condition_type == "not_empty" and variable_value is not None:
                        # Check if the variable has a value that would be considered non-empty
                        is_empty = (
                            variable_value is None
                            or variable_value == ""
                            or variable_value == []
                            or variable_value == {}
                            or (
                                isinstance(variable_value, str)
                                and variable_value.strip() == ""
                            )
                        )
                        # The condition is true if the variable is NOT empty
                        condition_result = not is_empty
                        logger.info(
                            f"Direct evaluation of condition '{condition}': {condition_result}"
                        )

                        # Set the result in the context and outputs
                        result_key = f"step_{step_index}_condition_result"
                        outputs[result_key] = condition_result

                        # Add a human-readable explanation
                        explanation_key = f"step_{step_index}_explanation"
                        if condition_result:
                            explanation = f"The condition '{condition}' is TRUE because '{variable_name}' is not empty"
                        else:
                            explanation = f"The condition '{condition}' is FALSE because '{variable_name}' is empty"
                        outputs[explanation_key] = explanation

                        await self._log_event(
                            execution_id=execution_id,
                            log_type="info",
                            content={
                                "message": f"Decision step '{step.step}' direct evaluation",
                                "condition": condition,
                                "result": condition_result,
                                "explanation": explanation,
                            },
                            node_id=step_id,
                            step_number=step_number,
                        )
                        return outputs
            except Exception as e:
                logger.warning(
                    f"Error in direct condition evaluation: {e}. Falling back to LLM."
                )

        # Create a system prompt that explains the step's purpose and expected behavior
        step_type_descriptions = {
            "input": "An input step defines or retrieves variables to be used in the workflow.",
            "process": "A process step performs custom logic on input data to produce new outputs.",
            "output": "An output step collects variables to be returned as the final result.",
            "decision": "A decision step evaluates a condition to determine if workflow should continue.",
            "transform": "A transform step performs data transformations on input variables.",
            "tool": "A tool step calls external tools or APIs to retrieve data.",
        }

        step_type_desc = step_type_descriptions.get(
            step.type, f"A {step.type} step in the workflow."
        )

        # Serialize non-serializable objects in context before sending to LLM
        def _safe_serialize(obj):
            """Helper to safely serialize objects that might not be JSON serializable."""
            try:
                # First attempt: use json serialization
                json.dumps(obj)
                return obj
            except (TypeError, json.JSONDecodeError):
                # Handle common types that aren't JSON serializable
                if hasattr(obj, "text"):
                    return obj.text
                elif hasattr(obj, "content") and isinstance(obj.content, str):
                    return obj.content
                elif hasattr(obj, "__dict__"):
                    # Serialize the object's attributes
                    return {
                        key: _safe_serialize(value)
                        for key, value in obj.__dict__.items()
                        if not key.startswith("_")
                    }
                else:
                    # Last resort
                    return str(obj)

        # Process the context to make it serializable
        filtered_context = {}
        input_variables = config.get("input_variables", [])
        context_vars = self.context.get_all()

        if input_variables:
            for var_name in input_variables:
                if var_name in context_vars:
                    filtered_context[var_name] = _safe_serialize(context_vars[var_name])
        elif step.type == "input":
            var_name = config.get("variable_name", f"step_{step_index}_input")
            if var_name in context_vars:
                filtered_context[var_name] = _safe_serialize(context_vars[var_name])
        elif step.type == "output":
            output_variables = config.get("output_variables", [])
            for var_name in output_variables:
                if var_name in context_vars:
                    filtered_context[var_name] = _safe_serialize(context_vars[var_name])
        elif step.type == "transform":
            # For transform steps, always process the input variables
            for var_name in input_variables:
                if var_name in context_vars:
                    filtered_context[var_name] = _safe_serialize(context_vars[var_name])
        else:
            # If no specific variables are defined, include a reasonable subset of context
            # Avoid including very large objects that would overwhelm the LLM
            for key, value in context_vars.items():
                # Skip values that are too large or complex
                if isinstance(value, (str, int, float, bool)) or (
                    isinstance(value, (list, dict)) and len(str(value)) < 1000
                ):
                    filtered_context[key] = _safe_serialize(value)

        # Include agent information in the context
        filtered_context["agent_name"] = self.agent.name
        filtered_context["agent_id"] = self.agent.id

        # Special handling for transform steps
        if step.type == "transform":
            transformation = config.get("transformation", "json_stringify")
            input_vars = config.get("input_variables", [])
            output_var = config.get("output_variable", f"step_{step_index}_result")

            # Handle common transformations directly without LLM if possible
            try:
                transformation = transformation.lower()

                # Get the input values
                input_values = [filtered_context.get(var, None) for var in input_vars]

                # Perform the transformation
                if transformation == "json_stringify" and len(input_values) > 0:
                    # Convert to JSON string
                    result = json.dumps(input_values[0], default=str)
                    outputs[output_var] = result
                    await self._log_event(
                        execution_id,
                        "info",
                        {
                            "message": f"Transform step '{step.step}' direct evaluation for '{transformation}'",
                            "output_variable": output_var,
                        },
                        step_id,
                        step_number,
                    )
                    return outputs
                # Add more transformations as needed
            except Exception as e:
                logger.warning(
                    f"Error in direct transform handling: {e}. Falling back to LLM."
                )
                # Fall through to LLM-based handling

        # Serialize the step configuration to JSON for the LLM
        config_json = json.dumps(config, indent=2)

        # Create a system prompt for the LLM
        persistent_vars_info = ""
        if self.context.get_all():
            persistent_vars_info = f"""
PERSISTENT VARIABLES AVAILABLE:
{json.dumps(self.context.get_all(), indent=2, default=str)}

These variables have been created in previous steps and should be reused when appropriate.
For example, if a spreadsheet was created earlier, use its ID/URL instead of creating a new one.
"""

        system_prompt = f"""You are processing a workflow step in an agent execution.

STEP TYPE: {step.type}
STEP DESCRIPTION: {step_type_desc}
STEP NAME: {step.step}
STEP DETAILS: {step.description}

STEP CONFIGURATION:
{config_json}
{persistent_vars_info}
Your task is to execute this step according to its type and configuration.
Based on the step type, perform the appropriate action and determine what output variables to set.
When working with resources like spreadsheets, documents, or files, check if they already exist in the persistent variables before creating new ones.

IMPORTANT: If the configuration specifies an 'output_variable_name', you MUST create that variable with a summary of your results.
This ensures proper data flow between workflow steps.
"""

        # Create a user message that includes the current context and asks for execution
        # Extract required output variable from config if specified
        required_output_var = config.get("output_variable_name")
        output_instructions = ""
        if required_output_var:
            output_instructions = f"""

REQUIRED OUTPUT: You MUST create a variable named '{required_output_var}' that contains a summary or reference to your main results.
This is critical for workflow continuity - subsequent steps will look for this variable."""

        user_message = f"""Please execute this {step.type} step using the following context variables:

CONTEXT VARIABLES:
{json.dumps(filtered_context, indent=2, default=str)}
USER'S ID: {self.agent.user_id}
{output_instructions}

Determine the appropriate outputs for this step based on its type and configuration.
For each output variable, provide the variable name and its value.
Return your response as a JSON object with these outputs.
"""

        await self._log_event(
            execution_id=execution_id,
            log_type="llm_input",
            content={
                "message": f"Sending request to LLM for step '{step.step}'",
                "system_prompt_preview": system_prompt[:200],
                "user_message_preview": user_message[:200],
            },
            node_id=step_id,
            step_number=step_number,
        )

        try:
            # Call LLM through MCP client
            llm_response, _ = await self.mcp_client.execute_llm_interaction(
                system_prompt=system_prompt,
                user_messages=[{"role": "user", "content": user_message}],
                interaction_id_for_logging=f"step_{step_index}_exec_{execution_id}",
            )

            await self._log_event(
                execution_id=execution_id,
                log_type="llm_output",
                content={
                    "message": f"Received LLM response for step '{step.step}'",
                    "response_preview": llm_response[:200],
                },
                node_id=step_id,
                step_number=step_number,
            )

            # Parse the LLM response to extract the outputs
            # The LLM should return a JSON object with the output variables
            try:
                # Find JSON in the response
                json_start = llm_response.find("{")
                json_end = llm_response.rfind("}") + 1

                if json_start >= 0 and json_end > json_start:
                    json_str = llm_response[json_start:json_end]
                    node_outputs = json.loads(json_str)

                    # Update context with the outputs
                    for key, value in node_outputs.items():
                        outputs[key] = value
                else:
                    # Fallback if no JSON found: treat the entire response as a single output
                    fallback_var = config.get(
                        "output_variable_name", f"step_{step_index}_result"
                    )
                    outputs[fallback_var] = llm_response

                logger.info(
                    f"Processed step with LLM and extracted {len(outputs)} outputs"
                )

            except json.JSONDecodeError as e:
                # If JSON parsing fails, use the raw response as the output
                logger.warning(f"Failed to parse LLM response as JSON: {e}")
                fallback_var = config.get(
                    "output_variable_name", f"step_{step_index}_result"
                )
                outputs[fallback_var] = llm_response

        except Exception as e:
            error_msg = f"Error during LLM interaction for step execution: {e}"
            logger.error(error_msg)
            self.context.set(f"step_{step_index}_error", error_msg)
            outputs[f"step_{step_index}_error"] = error_msg
            await self._log_event(
                execution_id,
                "error",
                {"message": error_msg, "exception_type": type(e).__name__},
                step_id,
                step_number,
            )

        return outputs

    async def _log_event(
        self,
        execution_id: str,
        log_type: LogType,
        content: Dict[str, Any],
        node_id: Optional[str] = None,
        step_number: Optional[int] = None,
        skip_if_execution_not_in_db: bool = False,
    ):
        """Helper method to create and upsert an execution log to database."""
        # Skip logging if execution record hasn't been inserted yet and skip flag is set
        if skip_if_execution_not_in_db and not getattr(
            self, "_execution_record_inserted", False
        ):
            logger.debug(
                f"Skipping log event {log_type} as execution record not yet inserted in database"
            )
            return

        log_entry = AgentExecutionLog(
            execution_id=execution_id,
            node_id=node_id,
            step_number=step_number,
            log_type=log_type,
            content=content,
            timestamp=datetime.now(timezone.utc),  # Use datetime object
        )
        try:
            if (
                self.db_client
                and hasattr(self.db_client, "upsert_agent_execution_log")
                and asyncio.iscoroutinefunction(
                    self.db_client.upsert_agent_execution_log
                )
            ):
                await self.db_client.upsert_agent_execution_log(log_entry)
            elif (
                self.db_client
                and hasattr(self.db_client, "insert_agent_execution_log")
                and asyncio.iscoroutinefunction(
                    self.db_client.insert_agent_execution_log
                )
            ):
                # Fallback to insert if upsert is not available
                await self.db_client.insert_agent_execution_log(log_entry)
            elif (
                self.db_client
            ):  # db_client exists but method is not async or doesn't exist
                logger.warning(
                    "db_client does not have upsert_agent_execution_log or insert_agent_execution_log async methods. Skipping log."
                )
            else:
                logger.warning(
                    "No db_client available for logging execution event. Skipping log."
                )
        except Exception as e:
            logger.error(
                f"Failed to save execution log to database: {e} - Log: {log_entry.model_dump_json()}"
            )

    async def execute_workflow(
        self,
        initial_context: Optional[Dict[str, Any]] = None,
        trigger_type_override: Optional[TriggerType] = None,
        trigger_id_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute the entire workflow using the linear workflow steps.

        Args:
            initial_context: Optional initial context to seed the workflow
            trigger_type_override: Optional override for the trigger type.
            trigger_id_override: Optional override for the trigger ID.

        Returns:
            A dictionary containing the execution_id, workflow_final_status,
            and either final_outputs (on success) or error details and context (on failure).
        """
        logger.info(
            f"Starting workflow execution for agent '{self.agent.name}' (ID: {self.agent.id})"
        )

        # Initialize workflow context
        if initial_context:
            self.context.update(initial_context)

        agent_execution_id = str(uuid.uuid4())  # Pre-generate for immediate use

        execution_record = AgentExecution(
            id=agent_execution_id,
            agent_id=self.agent.id,
            user_id=self.agent.user_id,
            trigger_id=trigger_id_override,
            trigger_type=trigger_type_override
            or "manual",  # Default to 'manual' if not provided
            initial_context=self.context.get_all(),
            state="running",  # Initial state
            started_at=datetime.now(timezone.utc),
            # created_at and updated_at will be set by Pydantic default_factory
        )

        db_record_inserted_successfully = False
        final_outputs = {}  # Initialize here for broader scope

        # Add workflow metadata to context
        self.context.update(
            {
                "execution_id": agent_execution_id,
                "agent_id": self.agent.id,
                "agent_name": self.agent.name,
            }
        )

        # Initialize execution record insertion flag
        self._execution_record_inserted = False

        try:
            if (
                self.db_client
                and hasattr(self.db_client, "insert_agent_execution")
                and asyncio.iscoroutinefunction(self.db_client.insert_agent_execution)
            ):
                returned_id = await self.db_client.insert_agent_execution(
                    execution_record
                )
                if returned_id:
                    agent_execution_id = returned_id  # Prefer DB-confirmed ID
                    execution_record.id = (
                        agent_execution_id  # Update record with confirmed ID
                    )
                    # Update context with confirmed ID
                    self.context.set("execution_id", agent_execution_id)
                db_record_inserted_successfully = True
                self._execution_record_inserted = True
                logger.info(
                    f"AgentExecution record {agent_execution_id} created in database for agent {self.agent.id}"
                )
            elif self.db_client:
                logger.warning(
                    "db_client.insert_agent_execution is not available. Execution will not be fully logged to DB."
                )
                db_record_inserted_successfully = False
            else:  # self.db_client is None
                logger.warning(
                    "No db_client available. Execution will not be logged to DB."
                )
                db_record_inserted_successfully = False

            # Add additional workflow metadata to context
            self.context.update(
                {
                    "user_id": self.agent.user_id,
                    "workflow_objective": (
                        self.agent.structured_instructions.objective
                        if self.agent.structured_instructions
                        else "No explicit objective provided"
                    ),
                }
            )

            await self._log_event(
                execution_id=agent_execution_id,
                log_type="info",
                content={
                    "message": "Workflow started",
                    "initial_context_keys": list(self.context.get_all().keys()),
                },
                skip_if_execution_not_in_db=True,
            )

            if not self.workflow_steps:
                logger.error(
                    f"No workflow steps defined for agent '{self.agent.id}'. Execution: {agent_execution_id}"
                )
                raise ValueError("No workflow steps defined for the agent.")

            self.executed_steps = set()
            self.current_step = 0
            # final_outputs initialized earlier

            step_index = 0
            should_continue = True

            while (
                step_index < len(self.workflow_steps)
                and should_continue
                and self.current_step < MAX_WORKFLOW_STEPS
            ):
                self.current_step += 1
                self.executed_steps.add(step_index)

                current_workflow_step = self.workflow_steps[step_index]
                logger.info(
                    f"\nStep {self.current_step}/{MAX_WORKFLOW_STEPS}: Executing step {step_index} '{current_workflow_step.step}' (Type: {current_workflow_step.type}) (Execution: {agent_execution_id})"
                )

                step_outputs, should_continue = await self.execute_step(
                    step_index=step_index,
                    execution_id=agent_execution_id,
                    current_step_number=self.current_step,
                )

                # If this is an output step, collect the outputs
                if current_workflow_step.type == "output":
                    serializable_step_outputs = {}
                    for k, v in step_outputs.items():
                        try:
                            json.dumps(v)
                            serializable_step_outputs[k] = v
                        except TypeError:
                            serializable_step_outputs[k] = str(v)
                    final_outputs.update(serializable_step_outputs)

                # Move to next step
                step_index += 1

            if self.current_step >= MAX_WORKFLOW_STEPS and step_index < len(
                self.workflow_steps
            ):
                msg = f"Reached maximum workflow steps ({MAX_WORKFLOW_STEPS}). Terminating."
                logger.warning(f"{msg} (Execution: {agent_execution_id}).")
                execution_record.state = "failed"
                execution_record.error_message = msg
                self.context.set("workflow_status_detail", "terminated_max_steps")
                await self._log_event(
                    agent_execution_id,
                    "warning",
                    {"message": msg, "steps_executed": self.current_step},
                )
            elif not should_continue:
                msg = f"Workflow stopped early due to decision step returning False."
                logger.info(f"{msg} (Execution: {agent_execution_id})")
                execution_record.state = "completed"
                self.context.set(
                    "workflow_status_detail", "completed_stopped_by_decision"
                )
                await self._log_event(
                    agent_execution_id,
                    "info",
                    {"message": msg, "last_step_index": step_index - 1},
                )
            elif step_index >= len(self.workflow_steps):
                logger.info(
                    f"Workflow completed successfully - all steps executed. (Execution: {agent_execution_id})"
                )
                execution_record.state = "completed"
                self.context.set("workflow_status_detail", "completed_successfully")
            else:
                logger.info(f"Workflow completed. (Execution: {agent_execution_id})")
                execution_record.state = "completed"
                self.context.set("workflow_status_detail", "completed_successfully")

            execution_record.final_outputs = final_outputs
            return {
                "execution_id": agent_execution_id,
                "workflow_final_status": execution_record.state,
                "final_outputs": final_outputs,
                "context_preview": {
                    k: v for k, v in list(self.context.get_all().items())[:5]
                },  # Preview of context
            }

        except Exception as e:
            logger.error(
                f"Workflow execution failed for agent '{self.agent.name}' (Execution ID: {agent_execution_id}): {e}",
                exc_info=True,
            )
            execution_record.state = "failed"
            execution_record.error_message = str(e)
            execution_record.error_details = {
                "exception_type": type(e).__name__,
                "traceback": str(e.__traceback__),
            }
            # completed_at and updated_at will be set in finally

            await self._log_event(
                execution_id=agent_execution_id,
                log_type="error",
                content={
                    "message": f"Workflow failed: {str(e)}",
                    "exception_type": type(e).__name__,
                },
                step_number=self.current_step if hasattr(self, "current_step") else 0,
                skip_if_execution_not_in_db=True,
            )
            return {
                "error": str(e),
                "execution_id": agent_execution_id,
                "workflow_final_status": "failed",
                "final_outputs": final_outputs,  # Include any outputs gathered before failure
                "context": self.context.get_all(),
            }
        finally:
            current_time = datetime.now(timezone.utc)
            execution_record.completed_at = (
                execution_record.completed_at or current_time
            )
            execution_record.updated_at = current_time  # Always update this timestamp

            # Ensure state is one of the valid final states if not already explicitly set to failed/completed by try/except logic
            if execution_record.state not in ["completed", "failed"]:
                logger.warning(
                    f"Execution {agent_execution_id} ended with ambiguous state '{execution_record.state}'. Marking as failed."
                )
                execution_record.state = "failed"
                if not execution_record.error_message:
                    execution_record.error_message = (
                        "Workflow ended in an unexpected or ambiguous state."
                    )

            if (
                db_record_inserted_successfully  # only try to update if initial insert was attempted/successful
                and self.db_client
                and hasattr(self.db_client, "update_agent_execution")
                and asyncio.iscoroutinefunction(self.db_client.update_agent_execution)
            ):
                try:
                    update_payload = execution_record.model_dump(exclude_none=True)
                    await self.db_client.update_agent_execution(
                        agent_execution_id, update_payload
                    )
                    logger.info(
                        f"AgentExecution record {agent_execution_id} finalized in database with state: {execution_record.state}"
                    )
                except Exception as db_update_exc:
                    logger.error(
                        f"Failed to update AgentExecution record {agent_execution_id} in database: {db_update_exc}",
                        exc_info=True,
                    )
            elif not db_record_inserted_successfully:
                logger.warning(
                    f"Skipping final database update for execution {agent_execution_id} as initial record was not confirmed as inserted."
                )
            elif (
                self.db_client
            ):  # db_client exists but update_agent_execution is not available or not async
                logger.warning(
                    f"db_client.update_agent_execution not available. Final execution state for {agent_execution_id} not saved to database."
                )
            else:
                logger.warning(
                    f"No db_client available. Final execution state for {agent_execution_id} not saved to database."
                )

            await self._log_event(
                execution_id=agent_execution_id,
                log_type="info",
                content={
                    "message": "Workflow execution attempt finished.",
                    "final_recorded_state": execution_record.state,
                },
                skip_if_execution_not_in_db=True,
            )
            logger.info(
                f"Workflow execution attempt finished for agent '{self.agent.name}' (Execution ID: {agent_execution_id}). Final in-memory state: {execution_record.state}"
            )


# Example of how to use the AgentWorkflowRunner
async def run_agent_workflow(
    agent: Agent,
    initial_context: Optional[Dict[str, Any]] = None,
    trigger_type: Optional[TriggerType] = None,
    trigger_id: Optional[str] = None,
):
    """
    Function to initialize and run an agent's workflow.
    This function now also initializes the SupabaseDBLogClient.
    Args:
        agent: The Agent object to run.
        initial_context: Optional initial data for the workflow.
        trigger_type: The type of trigger initiating the workflow (e.g., 'manual', 'webhook').
        trigger_id: Optional ID of the specific trigger instance.
    """
    if not agent.structured_instructions or not agent.structured_instructions.workflow:
        logger.error(
            f"Agent '{agent.name}' has no structured instructions with workflow steps defined. Cannot run workflow."
        )
        return None

    # Initialize MCP client
    mcp_client = MCPClient()

    # Initialize Supabase client and our DB logger adapter
    db_log_client = None
    current_env = os.getenv("APP_ENV", "prod")

    try:
        supabase_native_client = create_supabase_client()  # From utils.py
        db_log_client = SupabaseDBLogClient(supabase_native_client)  # Our adapter
        logger.info(
            f"SupabaseDBLogClient initialized successfully for {current_env} environment."
        )
    except Exception as e:
        logger.error(
            f"Failed to initialize SupabaseDBLogClient for {current_env} environment: {e}. Execution will not be logged to database.",
            exc_info=True,
        )
        # db_log_client remains None, AgentWorkflowRunner will handle this.

    sse_url = (
        os.getenv("MCP_SERVER_DEV_URL")
        if os.getenv("APP_ENV") == "dev"
        else os.getenv("MCP_SERVER_PROD_URL")
    )

    if not sse_url:
        logger.error("MCP_SERVER_URL not found in environment variables or .env file.")
        return None

    try:
        # Connect to MCP server
        await mcp_client.connect_to_sse_server(sse_url)

        # Create workflow runner
        runner = AgentWorkflowRunner(
            agent, mcp_client, db_log_client, env=current_env
        )  # Pass db_client and env

        # Execute the workflow
        results = await runner.execute_workflow(
            initial_context=initial_context,  # Pass initial_context if provided to run_agent_workflow
            trigger_type_override=trigger_type,  # Pass trigger_type if provided
            trigger_id_override=trigger_id,  # Pass trigger_id if provided
        )

        return results
    except Exception as e:
        logger.error(f"Error running agent workflow: {e}")
        return {"error": str(e)}
    finally:
        # Always clean up MCP client
        await mcp_client.cleanup()
