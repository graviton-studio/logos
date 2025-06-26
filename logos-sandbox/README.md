# Agent Workflow System

A modular, LLM-powered workflow orchestration system that allows defining and executing agent-based workflows through a graph structure.

## System Overview

The system consists of the following components:

1. **Models (`models.py`)**: Pydantic models for workflow components (nodes, edges, graph)
2. **Workflow Runner (`workflow_runner.py`)**: Orchestrates graph execution via LLM-driven node processing
3. **MCP Client (`client.py`)**: Handles LLM and tool interactions
4. **API Server (`main.py`)**: FastAPI server for triggering workflows

## Key Features

- LLM-powered workflow graph execution
- Multiple node types (input, process, tool, decision, transform, loop)
- Separation of concerns between LLM and workflow logic
- Asynchronous execution

## Environment Setup

Create a `.env` file in the project root with the following variables:

```
# MCP Server - Required for LLM & tool interactions
SSE_SERVER_URL=http://localhost:3000/sse

# LLM Configuration
CLAUDE_MODEL=claude-3-5-sonnet-latest

# Authentication & Access
ANTHROPIC_API_KEY=your_anthropic_api_key_here
TEST_USER_ID=test-user-123

# Security Configuration
MCP_API_KEY=your_mcp_gateway_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Workflow Configuration
MAX_WORKFLOW_STEPS=20
EXECUTION_DATE=2023-07-01

# Logging
LOG_LEVEL=info
```

## Installation

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running Tests

The system includes test workflows to verify functionality:

```bash
# Run all test workflows
python workflow_tests.py

# Run the example agent in agent.py
python agent.py
```

## Test Workflows

The test workflows cover all node types and functionality:

1. **Basic Query Processing**: Simple 3-node workflow (Input → Process → Output)
2. **Decision-Based Workflow**: Tests branching logic (Input → Process → Decision → Different outputs)
3. **Tool and Transform Workflow**: Tests tool execution and data transformation (Input → Process → Tool → Transform → Output)
4. **Loop-Based Workflow**: Tests iterative processing (Input → Process → Decision → Loop → Output)

## Running the API Server

```bash
# Start the FastAPI server
python main.py
```

The server will be available at http://localhost:8000 with a `/trigger` endpoint for triggering agent workflows.
