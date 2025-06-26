# Logos Sandbox

The testing and development environment for Logos AI agents. This is where we experiment with agent workflows, test new integrations, and validate agent behavior before deploying to production. Think of it as the safe playground for your AI agents.

## What Does This Do?

The sandbox serves as a complete testing environment that mimics the production agent execution environment. It lets you:
- **Test agent workflows** without affecting real user data
- **Debug agent behavior** with detailed logging and execution traces
- **Prototype new features** before adding them to the main platform
- **Validate integrations** with mock data or sandbox API endpoints
- **Run automated tests** for agent reliability

## Architecture Role

In our system architecture, this is the **Agent Sandbox** that:
- Creates and executes Agent Objects in a controlled environment
- Provides a safe testing ground for agents that need integration access
- Validates agent workflows before they're deployed to production
- Offers debugging tools and execution visibility for development

## Key Features

- **LLM-powered Workflow Execution**: Full Claude Sonnet integration for realistic testing
- **Graph-based Agent Workflows**: Support for complex node-based agent logic
- **Multiple Node Types**: Input, process, tool, decision, transform, and loop nodes
- **MCP Client Integration**: Direct connection to the MCP Gateway for testing integrations
- **Comprehensive Logging**: Detailed execution traces and debugging information
- **Test Suite**: Automated tests covering all node types and workflow patterns

## Workflow Node Types

| Node Type | Purpose | Example Use |
|-----------|---------|-------------|
| **Input** | Accept user data or trigger events | "User uploads a document" |
| **Process** | LLM-powered data processing | "Summarize this email thread" |
| **Tool** | Call external integrations | "Search Gmail for recent emails" |
| **Decision** | Conditional branching logic | "If email is urgent, escalate" |
| **Transform** | Data formatting and manipulation | "Convert data to CSV format" |
| **Loop** | Iterative processing | "Process each item in list" |

## Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in this directory:

```bash
# MCP Gateway Connection
SSE_SERVER_URL=http://localhost:8080/sse
MCP_API_KEY=your-mcp-gateway-api-key

# AI Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key
CLAUDE_MODEL=claude-3-5-sonnet-latest

# Testing Configuration
TEST_USER_ID=test-user-123
WEBHOOK_SECRET=your-webhook-secret-here
MAX_WORKFLOW_STEPS=20
EXECUTION_DATE=2023-07-01

# Logging
LOG_LEVEL=info
```

### 3. Run Tests

```bash
# Run all test workflows
python workflow_tests.py

# Run the example agent
python agent.py

# Start the FastAPI server for webhook testing
python main.py
```

## How It Works

### Workflow Execution Process

1. **Load workflow definition** → Parse JSON/YAML workflow files
2. **Initialize execution context** → Set up variables, logging, MCP client
3. **Execute nodes sequentially** → Follow graph edges, handle branching
4. **Process node results** → Transform data, make decisions, call tools
5. **Complete execution** → Return final results, save execution logs

### Testing Flow

1. **Define test workflow** → Create workflow JSON with nodes and edges
2. **Set up test data** → Prepare input data and expected outputs
3. **Execute in sandbox** → Run workflow with full logging enabled
4. **Validate results** → Check outputs match expectations
5. **Review execution logs** → Debug any issues or unexpected behavior

## Test Workflows

The sandbox includes several test workflows to validate functionality:

### Basic Query Processing
```
Input → Process → Output
```
Simple 3-node workflow that accepts user input, processes it with LLM, and returns results.

### Decision-Based Workflow
```
Input → Process → Decision → [Path A / Path B] → Output
```
Tests conditional branching based on LLM decision-making.

### Tool and Transform Workflow
```
Input → Process → Tool → Transform → Output
```
Tests integration calls and data transformation capabilities.

### Loop-Based Workflow
```
Input → Process → Decision → Loop → Output
```
Tests iterative processing with exit conditions.

## File Structure

```
logos-sandbox/
├── main.py                 # FastAPI server for webhook testing
├── agent.py               # Example agent implementation
├── workflow_runner.py     # Core workflow execution engine
├── workflow_tests.py      # Comprehensive test suite
├── client.py              # MCP client for gateway communication
├── models.py              # Pydantic models for workflows
├── utils.py               # Helper functions and utilities
├── logging_config.py      # Logging setup and configuration
└── requirements.txt       # Python dependencies
```

## Core Components

### Workflow Runner (`workflow_runner.py`)
The heart of the sandbox - orchestrates workflow execution:
- Manages node execution order
- Handles data flow between nodes
- Provides execution context and logging
- Integrates with MCP client for tool calls

### MCP Client (`client.py`)
Handles communication with the MCP Gateway:
- Authenticates with API keys
- Makes tool calls to integrations
- Manages connection lifecycle
- Provides error handling and retries

### Models (`models.py`)
Pydantic models defining workflow structure:
- WorkflowGraph: Complete workflow definition
- WorkflowNode: Individual node configuration
- WorkflowEdge: Connections between nodes
- ExecutionContext: Runtime state and variables

## Running Individual Components

### Test a Specific Workflow
```bash
python -c "
from workflow_tests import test_basic_query_processing
test_basic_query_processing()
"
```

### Debug Agent Execution
```bash
# Run with debug logging
LOG_LEVEL=debug python agent.py
```

### Start Webhook Server
```bash
# Starts FastAPI server on localhost:8000
python main.py
```

### Manual Workflow Testing
```python
from workflow_runner import WorkflowRunner
from models import WorkflowGraph

# Load workflow from file
with open('test_workflow.json') as f:
    workflow_data = json.load(f)

# Execute workflow
runner = WorkflowRunner()
result = await runner.execute_workflow(
    WorkflowGraph(**workflow_data),
    initial_input="Test input"
)

print(f"Result: {result}")
```

## Environment Configuration

### Development Setup
- Set `LOG_LEVEL=debug` for detailed execution traces
- Use `TEST_USER_ID` for consistent test user identification
- Set lower `MAX_WORKFLOW_STEPS` to prevent runaway executions

### Integration Testing
- Point `SSE_SERVER_URL` to your MCP Gateway instance
- Use real API keys for integration testing (be careful with rate limits)
- Set appropriate `WEBHOOK_SECRET` for secure webhook handling

## Debugging Tips

### Execution Logging
All workflow executions are logged with detailed information:
```bash
# View execution logs
tail -f logs/workflow_execution.log

# Filter for specific workflow
grep "workflow_id=test-123" logs/workflow_execution.log
```

### Node-Level Debugging
Each node execution includes:
- Input data received
- Processing steps taken
- Output data generated
- Execution time and resource usage
- Any errors or warnings

### Integration Debugging
MCP client calls are logged with:
- Tool name and parameters
- Request/response data
- Authentication status
- Error details and retry attempts

## Testing Best Practices

### Workflow Design
- **Keep workflows simple** - Test one concept per workflow
- **Use clear node names** - Make debugging easier
- **Include validation nodes** - Check intermediate results
- **Handle edge cases** - Test with various input types

### Test Data
- **Use realistic data** - Mirror production scenarios
- **Test edge cases** - Empty inputs, large datasets, malformed data
- **Mock external services** - Avoid dependency on live APIs during testing
- **Version test data** - Keep test cases consistent across runs

## Performance Monitoring

The sandbox includes built-in performance monitoring:
- **Execution time tracking** per node and overall workflow
- **Memory usage monitoring** for resource-intensive operations
- **API call counting** to monitor integration usage
- **Error rate tracking** for reliability metrics

## Troubleshooting

### Common Issues

**"MCP client connection failed"**
- Check `SSE_SERVER_URL` and `MCP_API_KEY`
- Verify MCP Gateway is running and accessible
- Review network connectivity and firewall settings

**"Workflow execution timeout"**
- Increase `MAX_WORKFLOW_STEPS` if needed
- Check for infinite loops in workflow logic
- Review node processing time and optimize if necessary

**"Integration tool not found"**
- Verify tool is registered in MCP Gateway
- Check tool name spelling in workflow definition
- Ensure user has required permissions for integration

**"Memory or performance issues"**
- Monitor resource usage during execution
- Consider breaking large workflows into smaller chunks
- Use async execution for I/O-bound operations

## Contributing

When adding new features or tests:

1. **Follow existing patterns** - Look at `workflow_tests.py` for examples
2. **Add comprehensive logging** - Help future debugging efforts
3. **Include error handling** - Test both success and failure cases
4. **Update documentation** - Keep this README current
5. **Test with real data** - Validate against realistic scenarios

The sandbox is your safety net. Use it to experiment, break things, and learn how agents behave before they interact with real user data. It's designed to be forgiving and informative - take advantage of that!
