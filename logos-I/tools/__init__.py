from mcp.server.fastmcp import FastMCP
from .gcal.tools import register_gcal_tools
from .gmail.tools import register_gmail_tools
from .gsheets.tools import register_gsheets_tools
from .gdrive.tools import register_gdrive_tools
from .exa.tools import register_exa_tools
from .airtable.tools import register_airtable_tools
from .slack.tools import register_slack_tools


def register_all_tools(mcp: FastMCP):
    """Register all available tools with the MCP server."""
    register_gcal_tools(mcp)
    register_gmail_tools(mcp)
    register_gsheets_tools(mcp)
    register_gdrive_tools(mcp)
    register_exa_tools(mcp)
    register_airtable_tools(mcp)
    # register_slack_tools(mcp)
