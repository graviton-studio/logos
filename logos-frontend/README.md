This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Logos Frontend

## Agent Creation Process

The system allows users to create AI agents through a guided process:

1. **Define**: Users provide a natural language description of what they want the agent to do.
2. **Design**: The system uses LLM to parse the description and generate a structured workflow.
3. **Deploy**: After reviewing the generated agent configuration, users can deploy it.

## Server Actions

### Agent Processing

The application uses server actions to handle agent creation:

```typescript
// Process a natural language prompt to generate agent specifications
processAgentPrompt(prompt: string, agentName?: string): Promise<{ agent: Partial<Agent>; error?: string }>

// Save an agent to the database
saveAgent(agent: Partial<Agent>): Promise<{ agent: Agent; error?: string }>
```

### Environment Variables

To use the LLM integration for agent creation, set the following environment variables:

```
LLM_API_KEY=your-openai-api-key
LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4-turbo
```

## Types

The agent system uses TypeScript interfaces to define the structure of agents, including:

- `Agent`: The main agent definition
- `AgentTrigger`: Defines how agents are triggered
- `AgentExecution`: Tracks the execution of agents
- `AgentGraph`: Defines the visual workflow structure of agents
