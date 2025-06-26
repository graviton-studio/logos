from mcp.server.fastmcp import FastMCP
from utils.auth import TokenService
from integrations.slack import (
    SlackClient,
    SendMessageRequest,
    SendEphemeralMessageRequest,
    UpdateMessageRequest,
    DeleteMessageRequest,
    AddReactionRequest,
    RemoveReactionRequest,
    CreateConversationRequest,
    InviteToConversationRequest,
    SetConversationTopicRequest,
    SetConversationPurposeRequest,
    RenameConversationRequest,
    UploadFileRequest,
)
from typing import Optional, List


def register_slack_tools(mcp: FastMCP):
    @mcp.tool(
        name="slack_test_auth",
        description="Test Slack authentication and get workspace info",
    )
    async def test_auth(user_id: str):
        """Test authentication and get information about the authenticated user/bot."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.test_auth_async()
        return result

    @mcp.tool(
        name="slack_send_message", description="Send a message to a Slack channel"
    )
    async def send_message(request: SendMessageRequest):
        """Send a message to a Slack channel."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.send_message_async(
            channel=request.channel,
            text=request.text,
            thread_ts=request.thread_ts,
            blocks=request.blocks,
            reply_broadcast=request.reply_broadcast,
        )
        return result

    @mcp.tool(
        name="slack_send_ephemeral_message",
        description="Send an ephemeral message to a Slack channel (only visible to specified user)",
    )
    async def send_ephemeral_message(request: SendEphemeralMessageRequest):
        """Send an ephemeral message to a Slack channel."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.send_ephemeral_message_async(
            channel=request.channel,
            user=request.user,
            text=request.text,
            thread_ts=request.thread_ts,
            blocks=request.blocks,
        )
        return result

    @mcp.tool(name="slack_update_message", description="Update a Slack message")
    async def update_message(request: UpdateMessageRequest):
        """Update a Slack message."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.update_message_async(
            channel=request.channel,
            ts=request.ts,
            text=request.text,
            blocks=request.blocks,
        )
        return result

    @mcp.tool(name="slack_delete_message", description="Delete a Slack message")
    async def delete_message(request: DeleteMessageRequest):
        """Delete a Slack message."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.delete_message_async(
            channel=request.channel, ts=request.ts
        )
        return result

    @mcp.tool(
        name="slack_add_reaction",
        description="Add an emoji reaction to a Slack message",
    )
    async def add_reaction(request: AddReactionRequest):
        """Add an emoji reaction to a message."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.add_reaction_async(
            channel=request.channel, timestamp=request.timestamp, name=request.name
        )
        return result

    @mcp.tool(
        name="slack_remove_reaction",
        description="Remove an emoji reaction from a Slack message",
    )
    async def remove_reaction(request: RemoveReactionRequest):
        """Remove an emoji reaction from a message."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.remove_reaction_async(
            channel=request.channel, timestamp=request.timestamp, name=request.name
        )
        return result

    @mcp.tool(name="slack_upload_file", description="Upload a file to a Slack channel")
    async def upload_file(request: UploadFileRequest):
        """Upload a file to a Slack channel."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.upload_file_async(
            channels=request.channels,
            file=request.file,
            title=request.title,
            initial_comment=request.initial_comment,
            thread_ts=request.thread_ts,
        )
        return result

    @mcp.tool(
        name="slack_list_conversations",
        description="List all conversations (channels, DMs, etc.) in a Slack workspace",
    )
    async def list_conversations(
        user_id: str,
        types: str = "public_channel,private_channel,mpim,im",
        limit: int = 100,
        exclude_archived: bool = True,
        cursor: Optional[str] = None,
    ):
        """List all conversations in a Slack workspace."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.list_conversations_async(
            types=types, limit=limit, exclude_archived=exclude_archived, cursor=cursor
        )
        return result

    @mcp.tool(
        name="slack_get_conversation_info",
        description="Get information about a specific Slack conversation",
    )
    async def get_conversation_info(
        user_id: str, channel: str, include_locale: bool = False
    ):
        """Get information about a specific conversation."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.get_conversation_info_async(
            channel=channel, include_locale=include_locale
        )
        return result

    @mcp.tool(
        name="slack_get_conversation_history",
        description="Get message history from a Slack conversation",
    )
    async def get_conversation_history(
        user_id: str,
        channel: str,
        limit: int = 100,
        cursor: Optional[str] = None,
        latest: Optional[str] = None,
        oldest: Optional[str] = None,
        inclusive: bool = False,
    ):
        """Get message history from a conversation."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.get_conversation_history_async(
            channel=channel,
            limit=limit,
            cursor=cursor,
            latest=latest,
            oldest=oldest,
            inclusive=inclusive,
        )
        return result

    @mcp.tool(
        name="slack_get_conversation_members",
        description="Get members of a Slack conversation",
    )
    async def get_conversation_members(
        user_id: str, channel: str, limit: int = 100, cursor: Optional[str] = None
    ):
        """Get members of a conversation."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.get_conversation_members_async(
            channel=channel, limit=limit, cursor=cursor
        )
        return result

    @mcp.tool(
        name="slack_get_conversation_replies",
        description="Get replies to a message thread in Slack",
    )
    async def get_conversation_replies(
        user_id: str,
        channel: str,
        ts: str,
        limit: int = 100,
        cursor: Optional[str] = None,
        inclusive: bool = False,
    ):
        """Get replies to a message thread."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.get_conversation_replies_async(
            channel=channel, ts=ts, limit=limit, cursor=cursor, inclusive=inclusive
        )
        return result

    @mcp.tool(
        name="slack_create_conversation",
        description="Create a new Slack conversation (channel)",
    )
    async def create_conversation(request: CreateConversationRequest):
        """Create a new conversation (channel)."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.create_conversation_async(
            name=request.name, is_private=request.is_private, user_ids=request.user_ids
        )
        return result

    @mcp.tool(
        name="slack_invite_to_conversation",
        description="Invite users to a Slack conversation",
    )
    async def invite_to_conversation(request: InviteToConversationRequest):
        """Invite users to a conversation."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.invite_to_conversation_async(
            channel=request.channel, users=request.users
        )
        return result

    @mcp.tool(name="slack_join_conversation", description="Join a Slack conversation")
    async def join_conversation(user_id: str, channel: str):
        """Join a conversation."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.join_conversation_async(channel=channel)
        return result

    @mcp.tool(name="slack_leave_conversation", description="Leave a Slack conversation")
    async def leave_conversation(user_id: str, channel: str):
        """Leave a conversation."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.leave_conversation_async(channel=channel)
        return result

    @mcp.tool(
        name="slack_set_conversation_topic",
        description="Set the topic for a Slack conversation",
    )
    async def set_conversation_topic(request: SetConversationTopicRequest):
        """Set the topic for a conversation."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.set_conversation_topic_async(
            channel=request.channel, topic=request.topic
        )
        return result

    @mcp.tool(
        name="slack_set_conversation_purpose",
        description="Set the purpose for a Slack conversation",
    )
    async def set_conversation_purpose(request: SetConversationPurposeRequest):
        """Set the purpose for a conversation."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.set_conversation_purpose_async(
            channel=request.channel, purpose=request.purpose
        )
        return result

    @mcp.tool(
        name="slack_rename_conversation", description="Rename a Slack conversation"
    )
    async def rename_conversation(request: RenameConversationRequest):
        """Rename a conversation."""
        credentials = TokenService.refresh_token_if_needed(request.user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.rename_conversation_async(
            channel=request.channel, name=request.name
        )
        return result

    @mcp.tool(
        name="slack_archive_conversation", description="Archive a Slack conversation"
    )
    async def archive_conversation(user_id: str, channel: str):
        """Archive a conversation."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.archive_conversation_async(channel=channel)
        return result

    @mcp.tool(
        name="slack_unarchive_conversation",
        description="Unarchive a Slack conversation",
    )
    async def unarchive_conversation(user_id: str, channel: str):
        """Unarchive a conversation."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.unarchive_conversation_async(channel=channel)
        return result

    @mcp.tool(
        name="slack_get_user_info", description="Get information about a Slack user"
    )
    async def get_user_info(user_id: str, user: str):
        """Get information about a user."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.get_user_info_async(user=user)
        return result

    @mcp.tool(
        name="slack_list_users", description="List all users in a Slack workspace"
    )
    async def list_users(user_id: str, limit: int = 100, cursor: Optional[str] = None):
        """List all users in a workspace."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.list_users_async(limit=limit, cursor=cursor)
        return result

    @mcp.tool(
        name="slack_get_user_conversations",
        description="List conversations the calling user may access",
    )
    async def get_user_conversations(
        user_id: str,
        user: Optional[str] = None,
        types: str = "public_channel,private_channel,mpim,im",
        limit: int = 100,
        cursor: Optional[str] = None,
        exclude_archived: bool = False,
    ):
        """List conversations the calling user may access."""
        credentials = TokenService.refresh_token_if_needed(user_id, "slack")
        client = SlackClient(credentials.access_token)
        result = await client.get_user_conversations_async(
            user=user,
            types=types,
            limit=limit,
            cursor=cursor,
            exclude_archived=exclude_archived,
        )
        return result
