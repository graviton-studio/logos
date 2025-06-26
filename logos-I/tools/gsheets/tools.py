from mcp.server.fastmcp import FastMCP
from google.oauth2.credentials import Credentials
from utils.auth import TokenService
from integrations.gsheets import (
    GSheetsClient,
    CreateSpreadsheetRequest,
    GetSpreadsheetRequest,
    GetValuesRequest,
    UpdateValuesRequest,
    AppendValuesRequest,
)


def register_gsheets_tools(mcp: FastMCP):
    @mcp.tool(
        name="create_spreadsheet", description="Create a new Google Sheets spreadsheet"
    )
    async def create_spreadsheet(request: CreateSpreadsheetRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gsheets")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GSheetsClient(credentials)
        result = await client.create_spreadsheet_async(request.title)
        return result

    @mcp.tool(name="get_spreadsheet", description="Get a Google Sheets spreadsheet")
    async def get_spreadsheet(request: GetSpreadsheetRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gsheets")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GSheetsClient(credentials)
        result = await client.get_spreadsheet_async(request.spreadsheet_id)
        return result

    @mcp.tool(
        name="get_values", description="Get values from a Google Sheets spreadsheet"
    )
    async def get_values(request: GetValuesRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gsheets")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GSheetsClient(credentials)
        result = await client.get_values_async(
            request.spreadsheet_id, request.range_name
        )
        return result

    @mcp.tool(
        name="update_values", description="Update values in a Google Sheets spreadsheet"
    )
    async def update_values(request: UpdateValuesRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gsheets")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GSheetsClient(credentials)
        result = await client.update_values_async(
            request.spreadsheet_id, request.range_name, request.values
        )
        return result

    @mcp.tool(
        name="append_values", description="Append values to a Google Sheets spreadsheet"
    )
    async def append_values(request: AppendValuesRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gsheets")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GSheetsClient(credentials)
        result = await client.append_values_async(
            request.spreadsheet_id, request.range_name, request.values
        )
        return result
