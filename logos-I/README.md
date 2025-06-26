# Logos Integration Server (MCP Gateway)

The heart of the Logos system - a Python-based MCP (Model Context Protocol) gateway server that handles all the heavy lifting for integrations. Think of this as the middleman between your agents and the outside world (Gmail, Slack, Google Drive, etc.).

## What Does This Do?

This server sits between your AI agents and various services like Google Workspace, Slack, Airtable, and more. When an agent needs to read emails, create calendar events, or search through documents, it goes through this gateway server. The server handles authentication, makes the actual API calls, and sends the results back to your agents.

## Architecture Role

In our system architecture, this is the **MCP Gateway Server** that:
- Receives tool calls from agents with user credentials
- Routes requests to the appropriate integration (Gmail, Slack, etc.)
- Handles OAuth tokens and API authentication
- Returns results back to the requesting agent

## Key Features

- **7+ Integrations**: Gmail, Google Calendar, Google Drive, Google Sheets, Slack, Airtable, and Exa Search
- **Secure Authentication**: Handles OAuth tokens and API keys securely
- **MCP Protocol**: Uses the Model Context Protocol for clean agent communication
- **Tool Registration**: Automatically registers all available integration tools
- **API Key Protection**: Requires valid API keys for all requests

## Available Integrations

| Service | What It Does |
|---------|-------------|
| **Gmail** | Read, send, search emails. Manage labels and threads |
| **Google Calendar** | Create events, check availability, list upcoming meetings |
| **Google Drive** | Upload, download, search files. Manage sharing permissions |
| **Google Sheets** | Read, write, format spreadsheet data |
| **Slack** | Send messages, read channels, manage workspace data |
| **Airtable** | Query databases, create records, manage tables |
| **Exa Search** | Semantic web search with AI-powered results |

## Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in this directory:

```bash
# Required: API keys for gateway access
VALID_API_KEYS=your-gateway-api-key,another-key-if-needed

# Required: Database connection (from your main app)
DATABASE_URL=your-database-connection-string

# Optional: Service-specific API keys (only needed if using those services)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
AIRTABLE_API_KEY=your-airtable-api-key
EXA_API_KEY=your-exa-api-key
```

### 3. Run the Server

```bash
python main.py
```

The server starts on `http://localhost:8080` by default.

```bash
# Custom host/port
python main.py --host 0.0.0.0 --port 3001
```

## How It Works

1. **Agent makes request** → Sends MCP tool call with user credentials
2. **Gateway authenticates** → Checks API key and validates request
3. **Integration executes** → Calls appropriate service (Gmail, Slack, etc.)
4. **Results returned** → Sends data back to requesting agent

## Testing

The server includes built-in validation for all integrations. You can test individual tools or run the full test suite:

```bash
# Run all tests
python -m pytest

# Test specific integration
python -m pytest tests/test_gmail.py
```

## Security Notes

- **Never commit `.env` files** - They contain sensitive credentials
- **Rotate API keys regularly** - Especially if you suspect compromise
- **Use HTTPS in production** - The default setup is HTTP for development
- **Limit API key access** - Only give keys to trusted agents/users

## Integration Details

Each integration is self-contained in the `integrations/` directory. They all follow the same pattern:

- **Authentication handling** - OAuth tokens, API keys, etc.
- **Tool definitions** - What actions are available
- **Error handling** - Graceful failures and user-friendly error messages
- **Rate limiting** - Respects API limits for each service

## Deployment

For production deployment:

1. **Set environment variables** in your hosting platform
2. **Use a proper ASGI server** like Gunicorn with Uvicorn workers
3. **Set up SSL/TLS** for secure communication
4. **Configure logging** for monitoring and debugging

```bash
# Production deployment example
gunicorn main:starlette_app -w 4 -k uvicorn.workers.UvicornWorker
```

## Troubleshooting

### Common Issues

**"Invalid API key" errors**
- Check your `VALID_API_KEYS` environment variable
- Make sure the frontend is sending the correct Authorization header

**Integration failures**
- Verify service-specific API keys in your `.env` file
- Check if user has granted necessary permissions (OAuth scopes)
- Look at server logs for detailed error messages

**Performance issues**
- Check database connection and query performance
- Monitor API rate limits for external services
- Consider caching frequently accessed data

## Contributing

When adding new integrations:

1. Create a new file in `integrations/`
2. Follow the existing pattern (see `gmail.py` as a good example)
3. Add your tools to `tools/__init__.py`
4. Test thoroughly with real user credentials
5. Update this README with the new integration details

## File Structure

```
logos-I/
├── main.py              # Server startup and MCP gateway
├── client.py            # MCP client for external communication
├── integrations/        # All service integrations
│   ├── gmail.py
│   ├── slack.py
│   ├── gdrive.py
│   └── ...
├── tools/               # Tool definitions and registration
├── utils/               # Shared utilities (auth, db, etc.)
└── requirements.txt     # Python dependencies
```

This server is designed to be rock-solid reliable. It handles authentication, retries failed requests, and provides clear error messages when things go wrong. Your agents can trust it to get the job done.
