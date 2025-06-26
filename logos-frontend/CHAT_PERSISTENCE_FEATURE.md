# Chat Persistence Feature

## Overview

This feature adds persistent chat history functionality to the Logos Frontend chat system, allowing users to save and retrieve their conversation sessions with the AI assistant.

## Architecture

### Database Schema

The feature uses a single table in the Supabase PostgreSQL database:

#### `chat_messages` Table

- `id` (UUID, primary key) - Unique identifier for each message record
- `user_id` (UUID, foreign key to users table) - Links messages to users
- `session_id` (UUID) - Groups messages into conversations
- `message_id` (text) - The original AI SDK message ID
- `role` (text) - Message role: 'user', 'assistant', 'system'
- `content` (text, nullable) - Simple text content for basic messages
- `parts` (jsonb, nullable) - Complex message parts (tool calls, reasoning, etc.)
- `timestamp` (timestamptz) - When the message was created
- `sequence_number` (integer) - Message order within session
- `created_at` (timestamptz) - Database record creation time

#### `chat_session_summaries` View

Provides efficient session listing with:

- `session_id` - Session identifier
- `user_id` - Session owner
- `first_user_message` - Preview text for session list
- `last_message` - Most recent message content
- `message_count` - Total messages in session
- `started_at` - Session creation time
- `last_activity` - Most recent message time

### Security

- **Row Level Security (RLS)** policies ensure users can only access their own chat messages
- Authentication required for all API endpoints
- Session ownership validation prevents cross-user access

## API Endpoints

### `GET /api/chat/sessions`

Returns a list of the user's recent chat sessions.

**Response:**

```typescript
{
  sessions: Array<{
    session_id: string;
    first_user_message: string | null;
    last_message: string | null;
    message_count: number;
    started_at: string;
    last_activity: string;
  }>;
}
```

### `GET /api/chat/sessions/[sessionId]`

Returns all messages from a specific chat session.

**Response:**

```typescript
{
  messages: UIMessage[];
}
```

### `POST /api/chat/sessions/[sessionId]/messages`

Saves new messages to a session. Use "new" as sessionId to create a new session.

**Request:**

```typescript
{
  messages: UIMessage[];
  session_id?: string; // Optional for new sessions
}
```

**Response:**

```typescript
{
  success: true;
  session_id: string;
  message_count: number;
  filtered_count: number;
  inserted_ids: string[];
}
```

### `DELETE /api/chat/sessions/[sessionId]`

Deletes an entire chat session and all its messages.

**Response:**

```typescript
{
  success: true;
  deleted_count: number;
  session_id: string;
}
```

## Components

### Core Components

#### `ChatUI` (Enhanced)

The main chat interface, enhanced with session persistence:

- **Props**: `initialSessionId?`, `initialMessages?`
- **Features**: Auto-save, session management, error handling
- **Location**: `src/components/chat/ChatUI.tsx`

#### `ChatHistorySheet`

Slide-in panel for managing chat sessions:

- **Features**: Session listing, loading, deletion, new chat creation
- **Integration**: Uses Sheet UI component with smooth animations
- **Location**: `src/components/chat/ChatHistorySheet.tsx`

#### `SaveStatusIndicator`

Visual feedback for auto-save status:

- **States**: Saving, saved (with timestamp), error (with retry)
- **Design**: Unobtrusive, user-friendly messaging
- **Location**: `src/components/chat/SaveStatusIndicator.tsx`

### Utility Components

#### `useAutoSave` Hook

Handles automatic message persistence:

- **Features**: Debounced saving, error handling, manual force-save
- **Performance**: Only saves new messages, filters system messages
- **Location**: `src/lib/hooks/useAutoSave.ts`

#### Message Conversion Utilities

Handle UIMessage ↔ Database conversion:

- **Functions**: `uiMessageToChatMessageRecord`, `chatMessageRecordToUIMessage`
- **Features**: Batch operations, validation, error handling
- **Location**: `src/utils/chat-persistence.ts`

## User Experience

### Creating a New Chat

1. Navigate to `/home/chat` or click "New Chat" button
2. Chat starts with default system/assistant messages
3. Auto-save activates when user sends first message
4. Session ID generated and URL updates to `/home/chat/[sessionId]`

### Viewing Chat History

1. Click history button (sheet icon) in chat header
2. Sheet slides in from right with recent sessions
3. Sessions show preview text, message count, and relative time
4. Empty state shown when no sessions exist

### Loading a Previous Conversation

1. Open chat history sheet
2. Click on desired session
3. Page navigates to `/home/chat/[sessionId]`
4. Messages load from database and display in chat
5. Auto-save continues with existing session

### Deleting a Conversation

1. Open chat history sheet
2. Click trash icon next to session
3. Confirm deletion in dialog
4. Session removed with optimistic UI update
5. Fallback to new chat if current session deleted

## Auto-Save Functionality

### How It Works

- **Trigger**: Activates 2 seconds after new messages arrive
- **Filtering**: Only saves user/assistant messages (excludes system messages)
- **Deduplication**: Tracks last saved count to avoid duplicate saves
- **Error Handling**: Graceful failure with retry options

### Message Filtering

The system filters out:

- System messages with IDs containing "system-"
- Initial assistant messages with IDs containing "initial-assistant-"
- Invalid messages missing required fields

### Performance Optimizations

- Debounced saving prevents excessive API calls
- Abort controllers cancel outdated requests
- Pre-filtering avoids unnecessary API requests
- Efficient database queries with proper indexing

## Dynamic Routing

### Route Structure

- `/home/chat` - New chat (redirects to session ID)
- `/home/chat/[sessionId]` - Specific session
- `/home/chat/new` - Explicitly new chat

### Session Loading Process

1. Server-side session validation and message loading
2. Authentication check and user ownership verification
3. Database query with proper ordering and conversion
4. Props passed to ChatUI for initialization
5. Client-side auto-save activation

## Error Handling

### API Errors

- **401 Unauthorized**: Redirects to login
- **404 Not Found**: Redirects to new chat
- **500 Server Error**: Shows error message with retry

### Chat Completion Errors

- **Connection Errors**: Visual error banner with refresh option
- **Network Issues**: User-friendly error messages
- **Service Unavailable**: Clear instructions for recovery

### Auto-Save Errors

- **Authentication Issues**: Prompts for re-login
- **Network Failures**: Retry mechanism with manual force-save
- **Validation Errors**: Silent handling for filtered messages

## Testing Strategy

### Manual Testing Checklist

- [ ] Create new chat and verify session creation
- [ ] Send messages and verify auto-save functionality
- [ ] Load previous session and verify message restoration
- [ ] Delete session and verify removal
- [ ] Test error scenarios (network failures, auth issues)
- [ ] Verify URL navigation and browser history
- [ ] Test responsive design on different screen sizes

### Edge Cases

- [ ] Very long conversations (100+ messages)
- [ ] Rapid message sending (auto-save stress test)
- [ ] Session deletion while actively chatting
- [ ] Multiple browser tabs with same session
- [ ] Network interruption during save
- [ ] Authentication expiration during chat

## Security Considerations

### Data Protection

- All chat data protected by RLS policies
- User authentication required for all operations
- Session ownership validated on every request
- No cross-user data access possible

### Privacy

- Messages stored securely in Supabase
- No client-side persistence of sensitive data
- Proper cleanup of abort controllers and timeouts
- Session IDs use cryptographically secure generation

## Performance Metrics

### Database Performance

- Indexed queries for efficient session listing
- Sequence number ordering for message retrieval
- View-based session summaries for fast previews
- Proper foreign key relationships

### Client Performance

- Debounced auto-save reduces API calls
- Optimistic UI updates for better UX
- Efficient React re-renders with proper dependencies
- Lazy loading of chat history

## Future Enhancements

### Potential Improvements

- Message search functionality
- Session tagging and organization
- Export chat history feature
- Message editing and deletion
- Shared sessions (collaboration)
- Message reactions and annotations

### Scalability Considerations

- Database partitioning for large user bases
- CDN caching for static assets
- Background job processing for heavy operations
- Rate limiting for API endpoints

---

_This documentation covers the complete chat persistence feature implementation. For technical details, refer to the source code and inline comments._
