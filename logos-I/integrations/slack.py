from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from utils.decorators import async_threadpool


class SlackClient:
    def __init__(self, access_token: str):
        self.client = WebClient(token=access_token)

    def _handle_response(self, response) -> Dict[str, Any]:
        """Handle Slack API response and convert to dict."""
        if hasattr(response, "data"):
            return response.data
        return response

    # Auth methods
    def test_auth(self) -> Dict[str, Any]:
        """Test authentication and get information about the authenticated user/bot."""
        try:
            response = self.client.auth_test()
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def test_auth_async(self) -> Dict[str, Any]:
        """Test authentication and get information about the authenticated user/bot (async)."""
        return self.test_auth()

    # Conversations API methods
    def list_conversations(
        self,
        types: str = "public_channel,private_channel,mpim,im",
        limit: int = 100,
        exclude_archived: bool = True,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List all channels in a Slack team."""
        try:
            response = self.client.conversations_list(
                types=types,
                limit=limit,
                exclude_archived=exclude_archived,
                cursor=cursor,
            )
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def list_conversations_async(
        self,
        types: str = "public_channel,private_channel,mpim,im",
        limit: int = 100,
        exclude_archived: bool = True,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List all channels in a Slack team (async)."""
        return self.list_conversations(types, limit, exclude_archived, cursor)

    def get_conversation_info(
        self, channel: str, include_locale: bool = False
    ) -> Dict[str, Any]:
        """Retrieve information about a conversation."""
        try:
            response = self.client.conversations_info(
                channel=channel, include_locale=include_locale
            )
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def get_conversation_info_async(
        self, channel: str, include_locale: bool = False
    ) -> Dict[str, Any]:
        """Retrieve information about a conversation (async)."""
        return self.get_conversation_info(channel, include_locale)

    def get_conversation_history(
        self,
        channel: str,
        limit: int = 100,
        cursor: Optional[str] = None,
        latest: Optional[str] = None,
        oldest: Optional[str] = None,
        inclusive: bool = False,
    ) -> Dict[str, Any]:
        """Fetch a conversation's history of messages and events."""
        try:
            kwargs = {"channel": channel, "limit": limit, "inclusive": inclusive}
            if cursor:
                kwargs["cursor"] = cursor
            if latest:
                kwargs["latest"] = latest
            if oldest:
                kwargs["oldest"] = oldest

            response = self.client.conversations_history(**kwargs)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def get_conversation_history_async(
        self,
        channel: str,
        limit: int = 100,
        cursor: Optional[str] = None,
        latest: Optional[str] = None,
        oldest: Optional[str] = None,
        inclusive: bool = False,
    ) -> Dict[str, Any]:
        """Fetch a conversation's history of messages and events (async)."""
        return self.get_conversation_history(
            channel, limit, cursor, latest, oldest, inclusive
        )

    def get_conversation_members(
        self, channel: str, limit: int = 100, cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """Retrieve members of a conversation."""
        try:
            response = self.client.conversations_members(
                channel=channel, limit=limit, cursor=cursor
            )
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def get_conversation_members_async(
        self, channel: str, limit: int = 100, cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """Retrieve members of a conversation (async)."""
        return self.get_conversation_members(channel, limit, cursor)

    def get_conversation_replies(
        self,
        channel: str,
        ts: str,
        limit: int = 100,
        cursor: Optional[str] = None,
        inclusive: bool = False,
    ) -> Dict[str, Any]:
        """Retrieve a thread of messages posted to a conversation."""
        try:
            response = self.client.conversations_replies(
                channel=channel, ts=ts, limit=limit, cursor=cursor, inclusive=inclusive
            )
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def get_conversation_replies_async(
        self,
        channel: str,
        ts: str,
        limit: int = 100,
        cursor: Optional[str] = None,
        inclusive: bool = False,
    ) -> Dict[str, Any]:
        """Retrieve a thread of messages posted to a conversation (async)."""
        return self.get_conversation_replies(channel, ts, limit, cursor, inclusive)

    def create_conversation(
        self, name: str, is_private: bool = False, user_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Initiates a public or private channel-based conversation."""
        try:
            kwargs = {"name": name, "is_private": is_private}
            if user_ids:
                kwargs["user_ids"] = user_ids

            response = self.client.conversations_create(**kwargs)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def create_conversation_async(
        self, name: str, is_private: bool = False, user_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Initiates a public or private channel-based conversation (async)."""
        return self.create_conversation(name, is_private, user_ids)

    def invite_to_conversation(self, channel: str, users: List[str]) -> Dict[str, Any]:
        """Invites users to a channel."""
        try:
            response = self.client.conversations_invite(channel=channel, users=users)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def invite_to_conversation_async(
        self, channel: str, users: List[str]
    ) -> Dict[str, Any]:
        """Invites users to a channel (async)."""
        return self.invite_to_conversation(channel, users)

    def join_conversation(self, channel: str) -> Dict[str, Any]:
        """Joins an existing conversation."""
        try:
            response = self.client.conversations_join(channel=channel)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def join_conversation_async(self, channel: str) -> Dict[str, Any]:
        """Joins an existing conversation (async)."""
        return self.join_conversation(channel)

    def leave_conversation(self, channel: str) -> Dict[str, Any]:
        """Leaves a conversation."""
        try:
            response = self.client.conversations_leave(channel=channel)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def leave_conversation_async(self, channel: str) -> Dict[str, Any]:
        """Leaves a conversation (async)."""
        return self.leave_conversation(channel)

    def set_conversation_topic(self, channel: str, topic: str) -> Dict[str, Any]:
        """Sets the topic for a conversation."""
        try:
            response = self.client.conversations_setTopic(channel=channel, topic=topic)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def set_conversation_topic_async(
        self, channel: str, topic: str
    ) -> Dict[str, Any]:
        """Sets the topic for a conversation (async)."""
        return self.set_conversation_topic(channel, topic)

    def set_conversation_purpose(self, channel: str, purpose: str) -> Dict[str, Any]:
        """Sets the purpose for a conversation."""
        try:
            response = self.client.conversations_setPurpose(
                channel=channel, purpose=purpose
            )
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def set_conversation_purpose_async(
        self, channel: str, purpose: str
    ) -> Dict[str, Any]:
        """Sets the purpose for a conversation (async)."""
        return self.set_conversation_purpose(channel, purpose)

    def rename_conversation(self, channel: str, name: str) -> Dict[str, Any]:
        """Renames a conversation."""
        try:
            response = self.client.conversations_rename(channel=channel, name=name)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def rename_conversation_async(
        self, channel: str, name: str
    ) -> Dict[str, Any]:
        """Renames a conversation (async)."""
        return self.rename_conversation(channel, name)

    def archive_conversation(self, channel: str) -> Dict[str, Any]:
        """Archives a conversation."""
        try:
            response = self.client.conversations_archive(channel=channel)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def archive_conversation_async(self, channel: str) -> Dict[str, Any]:
        """Archives a conversation (async)."""
        return self.archive_conversation(channel)

    def unarchive_conversation(self, channel: str) -> Dict[str, Any]:
        """Reverses conversation archival."""
        try:
            response = self.client.conversations_unarchive(channel=channel)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def unarchive_conversation_async(self, channel: str) -> Dict[str, Any]:
        """Reverses conversation archival (async)."""
        return self.unarchive_conversation(channel)

    # Chat API methods
    def send_message(
        self,
        channel: str,
        text: str,
        thread_ts: Optional[str] = None,
        blocks: Optional[List[Dict]] = None,
        reply_broadcast: bool = False,
    ) -> Dict[str, Any]:
        """Send a message to a channel."""
        try:
            kwargs = {"channel": channel, "text": text}
            if thread_ts:
                kwargs["thread_ts"] = thread_ts
                kwargs["reply_broadcast"] = reply_broadcast
            if blocks:
                kwargs["blocks"] = blocks

            response = self.client.chat_postMessage(**kwargs)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def send_message_async(
        self,
        channel: str,
        text: str,
        thread_ts: Optional[str] = None,
        blocks: Optional[List[Dict]] = None,
        reply_broadcast: bool = False,
    ) -> Dict[str, Any]:
        """Send a message to a channel (async)."""
        return self.send_message(channel, text, thread_ts, blocks, reply_broadcast)

    def update_message(
        self, channel: str, ts: str, text: str, blocks: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Update a message."""
        try:
            kwargs = {"channel": channel, "ts": ts, "text": text}
            if blocks:
                kwargs["blocks"] = blocks

            response = self.client.chat_update(**kwargs)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def update_message_async(
        self, channel: str, ts: str, text: str, blocks: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Update a message (async)."""
        return self.update_message(channel, ts, text, blocks)

    def delete_message(self, channel: str, ts: str) -> Dict[str, Any]:
        """Delete a message."""
        try:
            response = self.client.chat_delete(channel=channel, ts=ts)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def delete_message_async(self, channel: str, ts: str) -> Dict[str, Any]:
        """Delete a message (async)."""
        return self.delete_message(channel, ts)

    def send_ephemeral_message(
        self,
        channel: str,
        user: str,
        text: str,
        thread_ts: Optional[str] = None,
        blocks: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Send an ephemeral message (only visible to specified user)."""
        try:
            kwargs = {"channel": channel, "user": user, "text": text}
            if thread_ts:
                kwargs["thread_ts"] = thread_ts
            if blocks:
                kwargs["blocks"] = blocks

            response = self.client.chat_postEphemeral(**kwargs)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def send_ephemeral_message_async(
        self,
        channel: str,
        user: str,
        text: str,
        thread_ts: Optional[str] = None,
        blocks: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Send an ephemeral message (only visible to specified user) (async)."""
        return self.send_ephemeral_message(channel, user, text, thread_ts, blocks)

    # Reactions API methods
    def add_reaction(self, channel: str, timestamp: str, name: str) -> Dict[str, Any]:
        """Add an emoji reaction to a message."""
        try:
            response = self.client.reactions_add(
                channel=channel, timestamp=timestamp, name=name
            )
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def add_reaction_async(
        self, channel: str, timestamp: str, name: str
    ) -> Dict[str, Any]:
        """Add an emoji reaction to a message (async)."""
        return self.add_reaction(channel, timestamp, name)

    def remove_reaction(
        self, channel: str, timestamp: str, name: str
    ) -> Dict[str, Any]:
        """Remove an emoji reaction from a message."""
        try:
            response = self.client.reactions_remove(
                channel=channel, timestamp=timestamp, name=name
            )
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def remove_reaction_async(
        self, channel: str, timestamp: str, name: str
    ) -> Dict[str, Any]:
        """Remove an emoji reaction from a message (async)."""
        return self.remove_reaction(channel, timestamp, name)

    # Users API methods
    def get_user_info(self, user: str) -> Dict[str, Any]:
        """Get information about a user."""
        try:
            response = self.client.users_info(user=user)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def get_user_info_async(self, user: str) -> Dict[str, Any]:
        """Get information about a user (async)."""
        return self.get_user_info(user)

    def list_users(
        self, limit: int = 100, cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """List all users in a workspace."""
        try:
            response = self.client.users_list(limit=limit, cursor=cursor)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def list_users_async(
        self, limit: int = 100, cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """List all users in a workspace (async)."""
        return self.list_users(limit, cursor)

    def get_user_conversations(
        self,
        user: Optional[str] = None,
        types: str = "public_channel,private_channel,mpim,im",
        limit: int = 100,
        cursor: Optional[str] = None,
        exclude_archived: bool = False,
    ) -> Dict[str, Any]:
        """List conversations the calling user may access."""
        try:
            kwargs = {
                "types": types,
                "limit": limit,
                "exclude_archived": exclude_archived,
            }
            if user:
                kwargs["user"] = user
            if cursor:
                kwargs["cursor"] = cursor

            response = self.client.users_conversations(**kwargs)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def get_user_conversations_async(
        self,
        user: Optional[str] = None,
        types: str = "public_channel,private_channel,mpim,im",
        limit: int = 100,
        cursor: Optional[str] = None,
        exclude_archived: bool = False,
    ) -> Dict[str, Any]:
        """List conversations the calling user may access (async)."""
        return self.get_user_conversations(user, types, limit, cursor, exclude_archived)

    # Files API methods
    def upload_file(
        self,
        channels: str,
        file: str,
        title: Optional[str] = None,
        initial_comment: Optional[str] = None,
        thread_ts: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Upload a file to Slack."""
        try:
            kwargs = {"channels": channels, "file": file}
            if title:
                kwargs["title"] = title
            if initial_comment:
                kwargs["initial_comment"] = initial_comment
            if thread_ts:
                kwargs["thread_ts"] = thread_ts

            response = self.client.files_upload_v2(**kwargs)
            return self._handle_response(response)
        except SlackApiError as e:
            return {"ok": False, "error": str(e)}

    @async_threadpool
    async def upload_file_async(
        self,
        channels: str,
        file: str,
        title: Optional[str] = None,
        initial_comment: Optional[str] = None,
        thread_ts: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Upload a file to Slack (async)."""
        return self.upload_file(channels, file, title, initial_comment, thread_ts)


# Pydantic models for request validation
class SendMessageRequest(BaseModel):
    user_id: str
    channel: str
    text: str
    thread_ts: Optional[str] = None
    blocks: Optional[List[Dict]] = None
    reply_broadcast: bool = False


class SendEphemeralMessageRequest(BaseModel):
    user_id: str
    channel: str
    user: str
    text: str
    thread_ts: Optional[str] = None
    blocks: Optional[List[Dict]] = None


class UpdateMessageRequest(BaseModel):
    user_id: str
    channel: str
    ts: str
    text: str
    blocks: Optional[List[Dict]] = None


class DeleteMessageRequest(BaseModel):
    user_id: str
    channel: str
    ts: str


class AddReactionRequest(BaseModel):
    user_id: str
    channel: str
    timestamp: str
    name: str


class RemoveReactionRequest(BaseModel):
    user_id: str
    channel: str
    timestamp: str
    name: str


class CreateConversationRequest(BaseModel):
    user_id: str
    name: str
    is_private: bool = False
    user_ids: Optional[List[str]] = None


class InviteToConversationRequest(BaseModel):
    user_id: str
    channel: str
    users: List[str]


class SetConversationTopicRequest(BaseModel):
    user_id: str
    channel: str
    topic: str


class SetConversationPurposeRequest(BaseModel):
    user_id: str
    channel: str
    purpose: str


class RenameConversationRequest(BaseModel):
    user_id: str
    channel: str
    name: str


class UploadFileRequest(BaseModel):
    user_id: str
    channels: str
    file: str
    title: Optional[str] = None
    initial_comment: Optional[str] = None
    thread_ts: Optional[str] = None
