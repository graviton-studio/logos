import { experimental_createMCPClient, streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requestAccessTool } from "@/lib/tools";

interface MessagePart {
  type: string;
  data?: string;
  mimeType?: string;
  text?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  parts?: MessagePart[];
  id?: string;
  createdAt?: Date;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Debug logging to see what messages we're receiving
  console.log("=== COMPLETION API DEBUG ===");
  console.log("Number of messages:", messages.length);

  messages.forEach((message: ChatMessage, index: number) => {
    console.log(`Message ${index}:`, {
      role: message.role,
      content:
        typeof message.content === "string"
          ? message.content.substring(0, 100) + "..."
          : message.content,
      hasParts: !!message.parts,
      parts: message.parts?.map((part: MessagePart) => ({
        type: part.type,
        hasData: !!part.data,
        mimeType: part.mimeType,
        dataLength: part.data?.length || 0,
      })),
    });
  });

  // Extract file content for context
  const fileContents: string[] = [];
  messages.forEach((message: ChatMessage) => {
    if (message.parts) {
      message.parts.forEach((part: MessagePart) => {
        if (part.type === "file" && part.data) {
          fileContents.push(`File (${part.mimeType}): ${part.data}`);
        }
      });
    }
  });

  // Add file context to system message if files are present
  if (fileContents.length > 0) {
    console.log(`Found ${fileContents.length} files, adding to context`);

    // Find or create system message
    let systemMessageIndex = messages.findIndex(
      (m: ChatMessage) => m.role === "system",
    );
    if (systemMessageIndex === -1) {
      // Create system message if none exists
      messages.unshift({
        role: "system",
        content: "You are a helpful AI assistant.",
      });
      systemMessageIndex = 0;
    }

    // Enhance system message with file context
    const originalSystemContent = messages[systemMessageIndex].content;
    messages[systemMessageIndex].content = `${originalSystemContent}

UPLOADED FILES CONTEXT:
The user has uploaded ${fileContents.length} file(s). Here is the content:

${fileContents.join("\n\n---\n\n")}

END OF UPLOADED FILES CONTEXT

Please reference and analyze these files when responding to the user's questions.`;
  }

  try {
    const sseClient = await experimental_createMCPClient({
      transport: {
        type: "sse",
        headers: {
          Authorization: `Bearer ${process.env.MCP_API_KEY}`,
        },
        url:
          process.env.NODE_ENV === "development"
            ? process.env.MCP_SERVER_DEV_URL!
            : process.env.MCP_SERVER_PROD_URL!,
      },
    });

    const tools = await sseClient.tools();

    // Add our custom requestAccessTool to the MCP tools
    const allTools = {
      ...tools,
      request_access: requestAccessTool,
    };

    const response = streamText({
      model: anthropic("claude-3-7-sonnet-latest"),
      messages,
      tools: allTools,
      maxRetries: 2,
      maxSteps: process.env.MAX_STEPS ? parseInt(process.env.MAX_STEPS) : 10,
    });

    return response.toDataStreamResponse();
  } catch (error) {
    console.log("Error in completion route", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
