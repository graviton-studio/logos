import { tool } from "ai";
import { z } from "zod";

export const requestAccessTool = tool({
  description: `Request access to an integration that the user needs but hasn't enabled yet. 
  Only use this tool when the user asks for something that requires a specific integration they don't have access to.
  Check the enabled integrations list in the system message first.`,

  parameters: z.object({
    provider: z
      .enum(["gcal", "gmail", "gsheets", "airtable", "slack"])
      .describe("The integration provider identifier"),
    description: z
      .string()
      .describe(
        "A brief description of why this integration is needed for the user's request",
      ),
    requestContext: z
      .string()
      .describe("The original user request that requires this integration"),
  }),

  execute: async ({ provider, description, requestContext }) => {
    // This function is called when the LLM uses the tool
    // For request_access, we mainly want to return information that gets displayed in the UI
    return {
      success: true,
      message: `Integration access request created for ${provider}`,
      provider,
      description,
      requestContext,
      instructions:
        "Please connect this integration using the card above to continue.",
    };
  },
});
