# Logos Frontend

The web interface for the Logos AI agent platform. This is where users create, configure, and interact with their AI agents. Built with Next.js 14, it handles everything from agent creation to real-time chat sessions.

## What Does This Do?

This frontend is the main user interface for Logos. Users come here to:
- **Create AI agents** with natural language descriptions
- **Configure workflows** through a visual flow builder
- **Chat with agents** in real-time conversations
- **Manage integrations** with external services (Gmail, Slack, etc.)
- **View execution logs** and monitor agent performance

## Architecture Role

In our system architecture, this is the **Layer 1** and **Agent Builder** that:
- Takes user input and reforms prompts with intent, constraints, and necessary integrations
- Provides the visual interface for creating and managing agents
- Connects to the database to store user credentials and agent configurations
- Triggers agent execution through the backend services

## Key Features

- **Visual Agent Builder**: Drag-and-drop interface for creating agent workflows
- **Real-time Chat**: Live conversations with AI agents using streaming responses
- **Integration Management**: Connect and manage OAuth for various services
- **Chat History**: Persistent conversation storage with search and filtering
- **Execution Logs**: Detailed view of agent actions and decision-making
- **Authentication**: Secure user accounts with Supabase Auth

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Claude Sonnet integration for chat and agent processing
- **Real-time**: Server-sent events for streaming responses

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in this directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key

# MCP Gateway Integration
MCP_GATEWAY_URL=http://localhost:8080
MCP_GATEWAY_API_KEY=your-gateway-api-key

# OAuth Integration Credentials (optional, for integration setup)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
```

### 3. Set Up Database

The app uses Supabase for data storage. Run the migrations:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Start local Supabase (optional for development)
supabase start

# Apply migrations
supabase db push
```

### 4. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## How It Works

### Agent Creation Flow

1. **User describes their agent** → "I want an agent that summarizes my daily emails"
2. **System parses intent** → Identifies goal, constraints, required integrations
3. **Visual workflow generated** → Creates a flow diagram showing agent steps
4. **User reviews and deploys** → Agent becomes available in their account

### Chat System

1. **User starts conversation** → Creates new chat session
2. **Messages stream in real-time** → Uses Claude Sonnet with thinking enabled
3. **Agent can request integrations** → If user hasn't connected Gmail, shows integration card
4. **Conversations are saved** → Full history with search and organization

### Integration Management

1. **User enables integration** → Clicks connect button for Gmail, Slack, etc.
2. **OAuth flow initiated** → Redirects to service provider for authorization
3. **Tokens stored securely** → Encrypted storage in database
4. **Agent can use integration** → MCP gateway handles actual API calls

## File Structure

```
logos-frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router pages
│   │   ├── api/               # API routes (chat, integrations, etc.)
│   │   ├── auth/              # Authentication pages
│   │   ├── home/              # Main application pages
│   │   └── login/             # Login page
│   ├── components/            # React components
│   │   ├── agents/           # Agent management UI
│   │   ├── chat/             # Chat interface components
│   │   ├── flow/             # Visual workflow builder
│   │   ├── integrations/     # Integration management
│   │   └── ui/               # Reusable UI components (shadcn/ui)
│   ├── lib/                   # Utilities and configurations
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Helper functions
├── supabase/                  # Database migrations and schemas
└── public/                    # Static assets
```

## Key Components

### Agent Flow Builder
Visual workflow creator using React Flow. Users can:
- Add nodes (input, process, decision, output)
- Connect nodes with edges
- Configure node parameters
- Preview agent execution flow

### Chat Interface
Real-time messaging with:
- Streaming AI responses
- Integration request cards (when agent needs access)
- Message history and search
- Typing indicators and status updates

### Integration Cards
Dynamic UI that appears when agents need access to external services:
- Shows required permissions
- Handles OAuth flows
- Displays connection status
- Manages token refresh

## Database Schema

The app uses several key tables:

- **users**: User accounts and profiles
- **agents**: Agent configurations and metadata
- **chat_sessions**: Conversation sessions
- **chat_messages**: Individual messages
- **integrations**: User's connected services and OAuth tokens
- **execution_logs**: Agent execution history and debugging info

## API Routes

### Chat System
- `POST /api/chat` - Stream chat responses
- `GET/POST /api/chat/sessions` - Manage chat sessions
- `GET/POST /api/chat/sessions/[id]/messages` - Handle messages

### Integrations
- `POST /api/integrations/[provider]` - Connect OAuth services
- `DELETE /api/integrations/[provider]/revoke` - Disconnect services

### Agent Management
- Agent CRUD operations through server actions
- Execution log retrieval
- Workflow validation

## Styling

Uses Tailwind CSS with:
- **Dark mode support** - System preference detection
- **Responsive design** - Mobile-first approach
- **shadcn/ui components** - Consistent, accessible UI elements
- **Custom animations** - Smooth transitions and micro-interactions

## Security

- **Environment variables** for sensitive data
- **API key validation** for backend communication
- **OAuth token encryption** in database
- **CSRF protection** on forms
- **Input sanitization** for user content

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
Make sure all environment variables are set in your deployment platform (Vercel, Railway, etc.).

## Troubleshooting

### Common Issues

**"Database connection failed"**
- Check your Supabase URL and keys
- Verify network connectivity
- Ensure database is running

**"Integration OAuth not working"**
- Verify OAuth credentials in environment variables
- Check redirect URLs in your OAuth app settings
- Ensure proper scopes are requested

**"Chat not streaming"**
- Check Anthropic API key
- Verify network connectivity
- Look at browser network tab for failed requests

**"Agent creation failing"**
- Check MCP Gateway connection
- Verify API keys are correct
- Review server logs for detailed errors

## Contributing

When adding new features:

1. **Follow the established patterns** - Look at existing components for structure
2. **Add TypeScript types** - Keep everything type-safe
3. **Test responsive design** - Ensure mobile compatibility
4. **Update documentation** - Keep this README current
5. **Consider accessibility** - Use semantic HTML and ARIA labels

## Performance Notes

- **Image optimization** - Next.js automatic image optimization
- **Code splitting** - Automatic with App Router
- **Database optimization** - Indexed queries, connection pooling
- **Caching** - Aggressive caching for static content
- **Streaming** - Real-time updates without full page reloads

This frontend is designed to be intuitive and powerful. Users should be able to create sophisticated AI agents without needing to understand the technical complexity underneath.
