from mcp.server.fastmcp import FastMCP
from integrations.gcal import get_calendars, get_events


def register_gcal_tools(mcp: FastMCP):
    @mcp.tool(
        name="get_google_calendar_calendars",
        description="Get user's Google Calendar calendars",
    )
    async def get_google_calendar_calendars(user_id: str):
        return await get_calendars(user_id)

    @mcp.tool(
        name="get_google_calendar_events",
        description="Get user's Google Calendar events",
    )
    async def get_google_calendar_events(user_id: str):
        return await get_events(user_id)
