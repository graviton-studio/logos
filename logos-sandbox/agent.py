import asyncio
import json
import os
from typing import Dict, Any, Optional, List

from dotenv import load_dotenv

# Import the run_agent_workflow function from workflow_runner
from workflow_runner import run_agent_workflow
from models import (
    Agent,
    StructuredInstructions,
    WorkflowStep,
    Integration,
    AgentGraph,
    AgentNode,
    AgentEdge,
)

# Import our logging configuration
from logging_config import setup_logger

# Set up module logger
logger = setup_logger(__name__)

load_dotenv()  # Load environment variables from .env file

# The find_start_node_id function and run_agent_workflow function are now in workflow_runner.py
# Keeping the main block for testing and example purposes

if __name__ == "__main__":
    # Define a sample graph for testing directly within agent.py
    sample_graph_nodes = [
        AgentNode(
            id="input_user_query",
            type="input",
            config={
                "variable_name": "user_query",
                "description": "The initial query from the user",
                "default_value": "How can I improve my productivity?",
            },
            position={"x": 10, "y": 10},
            label="User Query Input",
        ),
        AgentNode(
            id="process_query",
            type="process",
            config={
                "input_variables": ["user_query", "agent_name"],
                "prompt_template": "Agent {agent_name}, process this user query: {user_query} and provide a helpful response. Be concise and practical.",
                "output_variable_name": "processed_query_result",
            },
            position={"x": 200, "y": 10},
            label="Process User Query",
        ),
        AgentNode(
            id="output_result",
            type="output",
            config={"output_variables": ["processed_query_result", "user_query"]},
            position={"x": 400, "y": 10},
            label="Present Result",
        ),
    ]

    sample_graph_edges = [
        AgentEdge(id="e1", source_id="input_user_query", target_id="process_query"),
        AgentEdge(id="e2", source_id="process_query", target_id="output_result"),
    ]

    sample_agent_graph = AgentGraph(
        nodes=sample_graph_nodes,
        edges=sample_graph_edges,
        metadata={"name": "Simple Query Processor Graph"},
    )

    sample_agent = Agent(
        id="agent-simple-workflow-001",
        name="Simple Workflow Agent",
        prompt="A test agent for demonstrating workflow execution.",
        description="Processes user queries with a simple graph workflow.",
        user_id="test-user-123",
        structured_instructions=StructuredInstructions(
            objective="Process a user query and provide a helpful response.",
            workflow=[
                WorkflowStep(
                    step="Input Query",
                    description="Receive the user query",
                    type="input",
                ),
                WorkflowStep(
                    step="Process Query",
                    description="Process the query with LLM",
                    type="process",
                ),
                WorkflowStep(
                    step="Output Result",
                    description="Present the result to the user",
                    type="output",
                ),
            ],
            integrations=[],
        ),
        graph=sample_agent_graph,
        is_public=False,
    )

    # Run the workflow using the imported run_agent_workflow function
    logger.info("Running sample agent workflow...")
    result = asyncio.run(run_agent_workflow(sample_agent))
    logger.info("\n=== Final Result ===")
    logger.info(json.dumps(result, indent=2, default=str))
