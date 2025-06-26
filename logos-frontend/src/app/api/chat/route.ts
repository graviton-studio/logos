import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { Message } from "ai/react";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Filter out system messages
  const filteredMessages = messages.filter(
    (message: Message) => message.role !== "system",
  );

  const result = streamText({
    model: anthropic("claude-3-7-sonnet-latest"),
    messages: filteredMessages,
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
