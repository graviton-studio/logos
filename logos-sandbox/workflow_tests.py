import asyncio
from datetime import datetime, timezone
import json
import os
import sys
import argparse
from typing import Dict, Any, List, Optional
import uuid
from dotenv import load_dotenv
from utils import insert_agent, delete_agent, delete_agent_execution
from workflow_runner import run_agent_workflow, DEV_WORKFLOW_LOG_FILE
from models import (
    Agent,
    AgentGraph,
    AgentNode,
    AgentEdge,
    Position,
    StructuredInstructions,
    WorkflowStep,
    Integration,
    TriggerType,
)

# Import our logging configuration
from logging_config import setup_logger

# Set up module logger
logger = setup_logger(__name__)

# Load environment variables
load_dotenv()
TEST_USER_ID = os.getenv("TEST_USER_ID", "test-user-123")

# Set APP_ENV to 'dev' for testing purposes BEFORE other imports that might use it.
# This ensures that file logging is used instead of database operations.
os.environ["APP_ENV"] = "dev"


# Helper function to run a test and print results
async def run_test_workflow(agent: Agent, name: str) -> Dict[str, Any]:
    """Run a single test workflow and return the results."""
    logger.info(f"\n{'='*80}")
    logger.info(f"RUNNING TEST WORKFLOW: {name}")
    logger.info(f"{'='*80}")
    logger.info(f"Agent: {agent.name} (ID: {agent.id})")
    logger.info(
        f"Nodes: {[f'{n.id} ({n.type})' for n in agent.graph.nodes if agent.graph]}"
    )

    # Provide a default initial context if needed, or None
    test_initial_context: Optional[Dict[str, Any]] = None
    # Example: test_initial_context = {"user_query": "Override default query for this test run"}

    # Provide a trigger type for the test run
    test_trigger_type: TriggerType = "manual"

    result_summary = {
        "status": "failed",
        "error_message": None,
        "execution_id": None,
        "workflow_status": None,
        "final_outputs": None,
        "full_result": None,
    }

    try:
        # Call the updated run_agent_workflow function
        # SupabaseDBLogClient will be initialized inside run_agent_workflow.
        # If SUPABASE_URL/KEY are not in .env for the test environment, it will proceed with warnings.
        output = await run_agent_workflow(
            agent=agent,
            initial_context=test_initial_context,
            trigger_type=test_trigger_type,
            trigger_id=str(uuid.uuid4()),  # Example trigger_id
        )

        result_summary["full_result"] = output
        result_summary["execution_id"] = output.get("execution_id")
        result_summary["workflow_status"] = output.get("workflow_final_status")

        if output.get("error"):
            result_summary["status"] = "failed"
            result_summary["error_message"] = output["error"]
            logger.error(f"\nTEST FAILED (reported by workflow): {name}")
            logger.error(f"Execution ID: {result_summary['execution_id']}")
            logger.error(f"Workflow Status: {result_summary['workflow_status']}")
            logger.error(f"Error: {result_summary['error_message']}")
        else:
            result_summary["status"] = "success"
            result_summary["final_outputs"] = output.get("final_outputs")
            logger.info(
                f"\n--- TEST RESULTS --- (Execution ID: {result_summary['execution_id']})"
            )
            logger.info(f"Workflow Status: {result_summary['workflow_status']}")
            logger.info("Final Outputs (if any from Output Nodes):")
            logger.info(
                json.dumps(result_summary["final_outputs"], indent=2, default=str)
            )
            if not result_summary["final_outputs"]:
                logger.info(
                    "(No dedicated 'final_outputs'. Full result context below.)"
                )
            logger.info("Full Workflow Result:")
            logger.info(json.dumps(output, indent=2, default=str))

        logger.info(f"\nTEST COMPLETE: {name} - Status: {result_summary['status']}")

    except Exception as e:
        # This catches exceptions raised by run_agent_workflow itself or by the test harness
        result_summary["error_message"] = str(e)
        logger.error(f"\nTEST FAILED (exception in test harness): {name}")
        logger.error(f"Error: {str(e)}", exc_info=True)
    finally:
        delete_agent(agent.id)
        # No need to delete agent execution from DB if we are in dev mode and logging to file.
        # However, if you want to keep the delete_agent_execution utility function for other purposes
        # or for prod tests, it might need to be aware of APP_ENV too, or simply try/fail gracefully.
        # For now, we will assume that if execution_id is None (e.g. outer error before exec_id assigned),
        # or if APP_ENV is dev, this call might not be relevant or might fail if it expects a DB entry.
        # A robust delete_agent_execution would check if the ID exists before attempting deletion.
        if os.getenv("APP_ENV") != "dev" and result_summary["execution_id"]:
            delete_agent_execution(result_summary["execution_id"])
        elif result_summary["execution_id"]:
            logger.info(
                f"Dev mode: Agent execution {result_summary['execution_id']} was logged to {DEV_WORKFLOW_LOG_FILE}, not deleting from DB."
            )
    return result_summary


# ============================================================================================
# TEST 1: Basic Query Processing
# Input → Process → Output
# Tests the simplest workflow with input handling, LLM processing, and output collection
# ============================================================================================


def create_basic_query_workflow() -> Agent:
    """Creates a simple 3-node workflow for processing a user query."""
    nodes = [
        AgentNode(
            id="input_query",
            type="input",
            config={
                "variable_name": "user_query",
                "description": "The user's initial query",
                "default_value": "What are the top 3 ways to improve productivity?",
            },
            position=Position(x=100, y=100),
            label="User Query Input",
        ),
        AgentNode(
            id="process_query",
            type="process",
            config={
                "input_variables": ["user_query", "agent_name"],
                "prompt_template": "Agent {agent_name}, process this user query: {user_query}\nProvide a helpful, concise response with practical advice. Do not use any tools.",
                "output_variable_name": "processed_result",
            },
            position=Position(x=300, y=100),
            label="Process Query",
        ),
        AgentNode(
            id="output_result",
            type="output",
            config={"output_variables": ["processed_result", "user_query"]},
            position=Position(x=500, y=100),
            label="Output Result",
        ),
    ]

    edges = [
        AgentEdge(id="e1", source_id="input_query", target_id="process_query"),
        AgentEdge(id="e2", source_id="process_query", target_id="output_result"),
    ]

    graph = AgentGraph(
        nodes=nodes,
        edges=edges,
        metadata={"name": "Basic Query Processing Workflow", "version": "1.0"},
    )

    return Agent(
        id=str(uuid.uuid4()),
        name="Basic Query Processor",
        created_at=datetime.now(timezone.utc).timestamp(),
        updated_at=datetime.now(timezone.utc).timestamp(),
        prompt="A test agent for processing basic queries.",
        description="Processes user queries using the simplest workflow structure.",
        structured_instructions=StructuredInstructions(
            objective="Process user queries and provide helpful responses.",
            workflow=[
                WorkflowStep(
                    step="Get Query", description="Receive the user query", type="input"
                ),
                WorkflowStep(
                    step="Process",
                    description="Process the query with LLM",
                    type="process",
                ),
                WorkflowStep(
                    step="Output", description="Return the result", type="output"
                ),
            ],
            integrations=[],
        ),
        graph=graph,
        is_public=False,
        user_id=TEST_USER_ID,
    )


# ============================================================================================
# TEST 2: Decision-Based Workflow
# Input → Process → Decision → Branch (True/False) → Different outputs
# Tests decision node functionality and conditional branching
# ============================================================================================
def create_decision_workflow() -> Agent:
    """Creates a workflow that incorporates a decision node with branching paths."""
    nodes = [
        AgentNode(
            id="input_query",
            type="input",
            config={
                "variable_name": "user_query",
                "description": "The user's query or task",
                "default_value": "Can you recommend some productivity tools?",
            },
            position=Position(x=100, y=100),
            label="User Query Input",
        ),
        AgentNode(
            id="analyze_query",
            type="process",
            config={
                "input_variables": ["user_query"],
                "prompt_template": "Analyze this query: {user_query}\n\nDetermine if this is a tool recommendation request. Respond with just the analysis.",
                "output_variable_name": "query_analysis",
            },
            position=Position(x=300, y=100),
            label="Analyze Query Intent",
        ),
        AgentNode(
            id="decision_is_tool_request",
            type="decision",
            config={
                "condition": "contains:tool",
                "input_variables": ["query_analysis"],
            },
            position=Position(x=500, y=100),
            label="Is Tool Request?",
        ),
        AgentNode(
            id="provide_tools",
            type="process",
            config={
                "input_variables": ["user_query"],
                "prompt_template": "The user has asked for tool recommendations: {user_query}\n\nProvide a list of 3-5 specific tools with brief descriptions.",
                "output_variable_name": "tool_recommendations",
            },
            position=Position(x=700, y=50),
            label="Provide Tool Recommendations",
        ),
        AgentNode(
            id="general_response",
            type="process",
            config={
                "input_variables": ["user_query"],
                "prompt_template": "The user has a general query: {user_query}\n\nProvide a helpful general response.",
                "output_variable_name": "general_response",
            },
            position=Position(x=700, y=150),
            label="General Response",
        ),
        AgentNode(
            id="output_tools",
            type="output",
            config={"output_variables": ["tool_recommendations", "user_query"]},
            position=Position(x=900, y=50),
            label="Output Tool Recommendations",
        ),
        AgentNode(
            id="output_general",
            type="output",
            config={"output_variables": ["general_response", "user_query"]},
            position=Position(x=900, y=150),
            label="Output General Response",
        ),
    ]

    edges = [
        AgentEdge(id="e1", source_id="input_query", target_id="analyze_query"),
        AgentEdge(
            id="e2", source_id="analyze_query", target_id="decision_is_tool_request"
        ),
        AgentEdge(
            id="e3",
            source_id="decision_is_tool_request",
            target_id="provide_tools",
            label="true",
        ),
        AgentEdge(
            id="e4",
            source_id="decision_is_tool_request",
            target_id="general_response",
            label="false",
        ),
        AgentEdge(id="e5", source_id="provide_tools", target_id="output_tools"),
        AgentEdge(id="e6", source_id="general_response", target_id="output_general"),
    ]

    graph = AgentGraph(
        nodes=nodes,
        edges=edges,
        metadata={"name": "Decision-Based Workflow", "version": "1.0"},
    )

    return Agent(
        id=str(uuid.uuid4()),
        name="Query Classifier",
        prompt="A test agent that classifies and routes user queries.",
        description="Analyzes queries to determine if they're tool recommendation requests.",
        created_at=datetime.now(timezone.utc).timestamp(),
        updated_at=datetime.now(timezone.utc).timestamp(),
        structured_instructions=StructuredInstructions(
            objective="Classify and respond to user queries appropriately.",
            workflow=[
                WorkflowStep(
                    step="Get Query", description="Receive the user query", type="input"
                ),
                WorkflowStep(
                    step="Analyze", description="Analyze query intent", type="process"
                ),
                WorkflowStep(
                    step="Decide", description="Make routing decision", type="decision"
                ),
                WorkflowStep(
                    step="Respond",
                    description="Generate appropriate response",
                    type="process",
                ),
                WorkflowStep(
                    step="Output", description="Return results", type="output"
                ),
            ],
            integrations=[],
        ),
        graph=graph,
        is_public=False,
        user_id=TEST_USER_ID,
    )


# ============================================================================================
# TEST 3: Tool and Transform Workflow
# Input → Process → Tool → Transform → Output
# Tests tool node execution and data transformation
# ============================================================================================
def create_tool_transform_workflow() -> Agent:
    """Creates a workflow that uses a tool node and transform node."""

    nodes = [
        AgentNode(
            id="input_search_query",
            type="input",
            config={
                "variable_name": "search_query",
                "description": "The search query to lookup",
                "default_value": "latest AI developments",
            },
            position=Position(x=100, y=100),
            label="Search Query Input",
        ),
        AgentNode(
            id="refine_query",
            type="process",
            config={
                "input_variables": ["search_query"],
                "prompt_template": "Refine this search query for optimal web search results: {search_query}\n\nProvide a concise, well-formatted search query.",
                "output_variable_name": "refined_query",
            },
            position=Position(x=300, y=100),
            label="Refine Search Query",
        ),
        AgentNode(
            id="web_search",
            type="tool",
            config={
                "tool": {
                    "id": "web_search_tool_1",
                    "agent_id": "test-tool-transform-001",
                    "tool_name": "exa_search",
                    "parameters": {},
                    "created_at": None,
                    "updated_at": None,
                },
                "input_mapping": {"query": "refined_query"},
                "output_mapping": {"search_results": "$output"},
            },
            position=Position(x=500, y=100),
            label="Web Search Tool",
        ),
        AgentNode(
            id="format_results",
            type="transform",
            config={
                "transformation": "json_stringify",
                "input_variables": ["search_results"],
                "output_variable": "formatted_results",
            },
            position=Position(x=700, y=100),
            label="Format Results",
        ),
        AgentNode(
            id="summarize_results",
            type="process",
            config={
                "input_variables": ["search_results", "search_query"],
                "prompt_template": "Summarize these search results for the query '{search_query}':\n\n{search_results}\n\nProvide a concise summary of the key findings.",
                "output_variable_name": "results_summary",
            },
            position=Position(x=900, y=100),
            label="Summarize Results",
        ),
        AgentNode(
            id="output_results",
            type="output",
            config={
                "output_variables": [
                    "results_summary",
                    "search_query",
                    "formatted_results",
                ]
            },
            position=Position(x=1100, y=100),
            label="Output Results",
        ),
    ]

    edges = [
        AgentEdge(id="e1", source_id="input_search_query", target_id="refine_query"),
        AgentEdge(id="e2", source_id="refine_query", target_id="web_search"),
        AgentEdge(id="e3", source_id="web_search", target_id="format_results"),
        AgentEdge(id="e4", source_id="format_results", target_id="summarize_results"),
        AgentEdge(id="e5", source_id="summarize_results", target_id="output_results"),
    ]

    graph = AgentGraph(
        nodes=nodes,
        edges=edges,
        metadata={"name": "Tool and Transform Workflow", "version": "1.0"},
    )

    return Agent(
        id=str(uuid.uuid4()),
        name="Web Search Assistant",
        prompt="A test agent that searches the web and transforms results.",
        description="Searches the web for information and processes the results.",
        created_at=datetime.now(timezone.utc).timestamp(),
        updated_at=datetime.now(timezone.utc).timestamp(),
        structured_instructions=StructuredInstructions(
            objective="Search for information and provide useful summaries.",
            workflow=[
                WorkflowStep(
                    step="Get Query", description="Get search query", type="input"
                ),
                WorkflowStep(
                    step="Refine", description="Refine search query", type="process"
                ),
                WorkflowStep(
                    step="Search", description="Perform web search", type="tool"
                ),
                WorkflowStep(
                    step="Transform",
                    description="Format search results",
                    type="transform",
                ),
                WorkflowStep(
                    step="Summarize", description="Summarize findings", type="process"
                ),
                WorkflowStep(
                    step="Output", description="Deliver results", type="output"
                ),
            ],
            integrations=[
                Integration(name="web_search", type="read", permissions=["query"])
            ],
        ),
        graph=graph,
        is_public=False,
        user_id=TEST_USER_ID,
    )


# ============================================================================================
# TEST 4: Loop-Based Workflow
# Input → Process → Decision → Loop → Output
# Tests loop node functionality for iterative processing
# ============================================================================================
def create_loop_workflow() -> Agent:
    """Creates a workflow that demonstrates loop node functionality."""

    nodes = [
        AgentNode(
            id="input_items",
            type="input",
            config={
                "variable_name": "items_list",
                "description": "List of items to process",
                "default_value": [
                    "Write email to team",
                    "Prepare presentation",
                    "Review quarterly report",
                    "Schedule meeting",
                ],
            },
            position=Position(x=100, y=100),
            label="Input Items List",
        ),
        AgentNode(
            id="check_list",
            type="process",
            config={
                "input_variables": ["items_list"],
                "prompt_template": "Check if this list has items to process: {items_list}\nRespond with whether the list is empty or not.",
                "output_variable_name": "list_analysis",
            },
            position=Position(x=300, y=100),
            label="Check List Status",
        ),
        AgentNode(
            id="decide_processing",
            type="decision",
            config={
                "condition": "not_empty:items_list",
                "input_variables": ["items_list"],
            },
            position=Position(x=500, y=100),
            label="Items to Process?",
        ),
        AgentNode(
            id="process_items",
            type="loop",
            config={
                "collection_variable": "items_list",
                "item_variable": "current_item",
                "max_iterations": 5,
            },
            position=Position(x=700, y=50),
            label="Process Each Item",
        ),
        AgentNode(
            id="prioritize_item",
            type="process",
            config={
                "input_variables": ["current_item"],
                "prompt_template": "Prioritize this task: {current_item}\nAssign a priority (High/Medium/Low) and estimate time required.",
                "output_variable_name": "prioritized_item",
            },
            position=Position(x=900, y=50),
            label="Prioritize Item",
        ),
        AgentNode(
            id="empty_list_response",
            type="process",
            config={
                "input_variables": [],
                "prompt_template": "The task list is empty. Please add tasks to process.",
                "output_variable_name": "empty_list_message",
            },
            position=Position(x=700, y=150),
            label="Empty List Response",
        ),
        AgentNode(
            id="output_processed",
            type="output",
            config={"output_variables": ["prioritized_item", "items_list"]},
            position=Position(x=1100, y=50),
            label="Output Processed Items",
        ),
        AgentNode(
            id="output_empty",
            type="output",
            config={"output_variables": ["empty_list_message"]},
            position=Position(x=900, y=150),
            label="Output Empty Message",
        ),
    ]

    edges = [
        AgentEdge(id="e1", source_id="input_items", target_id="check_list"),
        AgentEdge(id="e2", source_id="check_list", target_id="decide_processing"),
        AgentEdge(
            id="e3",
            source_id="decide_processing",
            target_id="process_items",
            label="true",
        ),
        AgentEdge(
            id="e4",
            source_id="decide_processing",
            target_id="empty_list_response",
            label="false",
        ),
        AgentEdge(id="e5", source_id="process_items", target_id="prioritize_item"),
        AgentEdge(id="e6", source_id="prioritize_item", target_id="output_processed"),
        AgentEdge(id="e7", source_id="empty_list_response", target_id="output_empty"),
    ]

    graph = AgentGraph(
        nodes=nodes,
        edges=edges,
        metadata={"name": "Loop-Based Workflow", "version": "1.0"},
    )

    return Agent(
        id=str(uuid.uuid4()),
        name="Task Prioritizer",
        created_at=datetime.now(timezone.utc).timestamp(),
        updated_at=datetime.now(timezone.utc).timestamp(),
        prompt="A test agent that processes a list of tasks using a loop.",
        description="Analyzes and prioritizes a list of tasks.",
        structured_instructions=StructuredInstructions(
            objective="Process task lists and prioritize each item.",
            workflow=[
                WorkflowStep(
                    step="Get Tasks", description="Receive list of tasks", type="input"
                ),
                WorkflowStep(
                    step="Check List",
                    description="Check if list has items",
                    type="process",
                ),
                WorkflowStep(
                    step="Decide",
                    description="Determine if processing needed",
                    type="decision",
                ),
                WorkflowStep(
                    step="Process Loop", description="Process each task", type="loop"
                ),
                WorkflowStep(
                    step="Prioritize",
                    description="Assign priority to task",
                    type="process",
                ),
                WorkflowStep(
                    step="Output", description="Return processed tasks", type="output"
                ),
            ],
            integrations=[],
        ),
        graph=graph,
        is_public=False,
        user_id=TEST_USER_ID,
    )


# ============================================================================================
# Main testing function
# ============================================================================================

# Dictionary mapping test names to their creation functions
AVAILABLE_TESTS = {
    "basic": create_basic_query_workflow,
    "decision": create_decision_workflow,
    "tool": create_tool_transform_workflow,
    "loop": create_loop_workflow,
}


async def run_specific_test(test_name: str) -> Dict[str, Any]:
    """Run a specific test by name."""
    if test_name not in AVAILABLE_TESTS:
        logger.error(
            f"Test '{test_name}' not found. Available tests: {', '.join(AVAILABLE_TESTS.keys())}"
        )
        return {"status": "error", "message": f"Test '{test_name}' not found"}

    agent = AVAILABLE_TESTS[test_name]()
    return await run_test_workflow(agent, test_name)


async def run_all_tests() -> Dict[str, Any]:
    """Run all the test workflows."""
    results = {}

    for test_name, test_creator in AVAILABLE_TESTS.items():
        agent = test_creator()
        results[test_name] = await run_test_workflow(agent, test_name)

    return results


def main():
    """Main entry point with command line argument handling."""
    parser = argparse.ArgumentParser(description="Run agent workflow tests")
    parser.add_argument(
        "--test",
        "-t",
        type=str,
        help="Run a specific test (basic, decision, tool, loop)",
    )
    parser.add_argument(
        "--list", "-l", action="store_true", help="List available tests"
    )

    args = parser.parse_args()

    if args.list:
        logger.info("Available tests:")
        for name in AVAILABLE_TESTS.keys():
            logger.info(f"  - {name}")
        return

    if args.test:
        asyncio.run(run_specific_test(args.test))
    else:
        asyncio.run(run_all_tests())


if __name__ == "__main__":
    main()
