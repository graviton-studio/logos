"""
Slack MCP Integration

This module provides comprehensive Slack integration tools for the MCP server using the official Slack SDK.

Available OAuth Scopes:
- channels:history - View messages and other content in a user's public channels
- channels:read - View basic information about public channels in a workspace
- chat:write - Send messages on a user's behalf
- users:read - View people in a workspace
- mpim:read - View basic information about a user's group direct messages
- im:read - View basic information about a user's direct messages
- groups:read - View basic information about a user's private channels
- identify - View information about a user's identity

Available Tools:

Authentication:
- slack_test_auth - Test authentication and get workspace info

Messaging:
- slack_send_message - Send messages to channels (supports threading and Block Kit)
- slack_send_ephemeral_message - Send ephemeral messages (only visible to specific users)
- slack_update_message - Update existing messages
- slack_delete_message - Delete messages
- slack_add_reaction - Add emoji reactions to messages
- slack_remove_reaction - Remove emoji reactions from messages

Conversations:
- slack_list_conversations - List all conversations (channels, DMs, etc.)
- slack_get_conversation_info - Get information about specific conversations
- slack_get_conversation_history - Get message history from conversations
- slack_get_conversation_members - Get members of conversations
- slack_get_conversation_replies - Get replies to message threads
- slack_create_conversation - Create new conversations (channels)
- slack_invite_to_conversation - Invite users to conversations
- slack_join_conversation - Join conversations
- slack_leave_conversation - Leave conversations
- slack_set_conversation_topic - Set conversation topics
- slack_set_conversation_purpose - Set conversation purposes
- slack_rename_conversation - Rename conversations
- slack_archive_conversation - Archive conversations
- slack_unarchive_conversation - Unarchive conversations

Users:
- slack_get_user_info - Get information about users
- slack_list_users - List all users in workspace
- slack_get_user_conversations - List conversations accessible to users

Files:
- slack_upload_file - Upload files to channels (supports threading)

Features:
- Full support for Slack's Conversations API
- Block Kit support for rich message formatting
- Threading support for organized conversations
- Pagination support with cursors
- Comprehensive error handling with SlackApiError
- Async/await support for all operations
- Proper OAuth token management and refresh

All tools require a user_id parameter to identify the authenticated user whose
Slack credentials should be used for the API calls.

The integration uses the official Slack SDK for Python, ensuring compatibility
with all Slack API features and best practices.
"""
