from mcp.server.fastmcp import FastMCP
from google.oauth2.credentials import Credentials
from utils.auth import TokenService
from integrations.gmail import (
    GmailClient,
    SendMessageRequest,
    CreateDraftRequest,
    ReplyMessageRequest,
)
from utils.goog import build_query


def register_gmail_tools(mcp: FastMCP):
    @mcp.tool(name="send_gmail_message", description="Send a Gmail message to a user")
    async def send_message(request: SendMessageRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gmail")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GmailClient(credentials)
        result = await client.send_message_async(
            to=request.to,
            subject=request.subject,
            message_text=request.message_text,
            attachments=request.attachments,
        )
        return result

    @mcp.tool(name="create_gmail_draft", description="Create a draft Gmail message")
    async def create_gmail_draft(request: CreateDraftRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gmail")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GmailClient(credentials)
        result = await client.create_draft_async(
            to=request.to,
            subject=request.subject,
            message_text=request.message_text,
            attachments=request.attachments,
        )
        return result

    @mcp.tool(name="reply_gmail_message", description="Reply to a Gmail message")
    async def reply_gmail_message(request: ReplyMessageRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gmail")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GmailClient(credentials)
        result = await client.reply_message_async(
            message_id=request.message_id,
            to=request.to,
            subject=request.subject,
            message_text=request.message_text,
            thread_id=request.thread_id,
        )
        return result

    @mcp.tool(name="list_gmail_messages", description="List a user's Gmail messages")
    async def list_gmail_messages(user_id: str, max_results: int = 10):
        credentials = TokenService.refresh_token_if_needed(user_id, "gmail")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GmailClient(credentials)
        result = await client.list_messages_async(max_results=max_results)
        return result

    @mcp.tool(
        name="search_gmail_messages", description="Search a user's Gmail messages"
    )
    async def search_gmail_messages(
        user_id: str,
        max_results: int = 10,
        from_: str = None,
        to: str = None,
        subject: str = None,
        after: str = None,
        before: str = None,
        has: str = None,
        exclude: list[str] = None,
        or_: list[str] = None,
        and_: list[str] = None,
        text: str = None,
    ):
        credentials = TokenService.refresh_token_if_needed(user_id, "gmail")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GmailClient(credentials)
        query = build_query(
            from_=from_, to=to, subject=subject, after=after, before=before, text=text
        )
        result = await client.search_messages_async(
            query=query, max_results=max_results
        )
        return result

    @mcp.tool(name="list_gmail_labels", description="List a user's Gmail labels")
    async def list_gmail_labels(user_id: str):
        credentials = TokenService.refresh_token_if_needed(user_id, "gmail")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GmailClient(credentials)
        result = await client.list_labels_async()
        return result

    @mcp.tool(
        name="get_gmail_message", description="Get a specific Gmail message by ID"
    )
    async def get_gmail_message(user_id: str, message_id: str):
        credentials = TokenService.refresh_token_if_needed(user_id, "gmail")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GmailClient(credentials)
        result = await client.get_message_async(message_id)
        return result
