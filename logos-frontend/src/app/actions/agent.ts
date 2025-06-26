"use server";

import {
  Agent,
  AgentGraph,
  AgentTrigger,
  StructuredInstructions,
} from "@/types/agent";
import { createScheduledTriggerConfig } from "@/utils/schedule";
import { revalidatePath } from "next/cache";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { generateObject } from "ai";
import { getAvailableTools } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";

/**
 * Server action that processes a natural language prompt using Claude 3.7 Sonnet
 * to generate agent specifications
 * @param prompt The user's natural language description of the agent
 * @param agentName Optional name for the agent
 * @returns The generated agent configuration
 */
export async function processAgentPrompt(
  prompt: string,
  userID: string,
  agentName?: string,
): Promise<{ agent: Agent | null; error?: string }> {
  try {
    const availableTools = await getAvailableTools();
    // Make API call to Anthropic Claude API
    const { object, finishReason, usage } = await generateObject({
      model: anthropic("claude-3-7-sonnet-latest"),
      system: `You are an expert AI assistant that helps users build AI agents based on natural language descriptions.
                Your task is to analyze the user's prompt and extract structured information to create an agent.
                
                The resulting agent should have:
                1. A clear objective based on the user's description
                2. A set of constraints that define boundaries of what the agent can/cannot do
                3. A list of tools the agent will need to accomplish its tasks
                4. A workflow represented as a graph with nodes and edges
                5. If the agent needs scheduling, provide it in a human-readable format like "6:00 PM Daily" or "Every Monday at 9:00 AM"
                
                For the graph, create:
                - Input nodes for starting points
                - Tool call nodes for API interactions
                - Decision nodes for conditional logic
                - Transform nodes for data manipulation
                - Output nodes for final results
                - Try to encapsulate this logic in <= 7 nodes

                Important layout guidelines:
                - The viewport size is 830x480 pixels
                - Position nodes vertically with equal spacing
                - Center nodes horizontally (around x=415)
                - Create straight vertical edges between nodes
                - For branching flows, offset child nodes horizontally by ±150px
                
                Return your response as a valid JSON object.
                Here are the tools available to the agent: ${JSON.stringify(
                  availableTools,
                )}
        `,
      prompt: `Create an agent based on this description: ${prompt}`,
      schema: z.object({
        structured_instructions: z.object({
          objective: z.string(),
          workflow: z.array(
            z.object({
              step: z.string(),
              description: z.string(),
              type: z.enum([
                "trigger",
                "input",
                "process",
                "output",
                "tool",
                "decision",
                "transform",
              ]),
            }),
          ),
          schedule: z
            .string()
            .optional()
            .transform((val) => {
              if (!val) return undefined;
              try {
                // Convert any technical schedule format to human readable
                if (val.includes("0 18 * * *")) return "6:00 PM Daily";
                if (val.includes("0 9 * * 1")) return "Every Monday at 9:00 AM";
                return val; // Return as is if already human readable
              } catch {
                return val;
              }
            }),
          integrations: z.array(
            z.object({
              name: z.string(),
              type: z.enum(["read", "write"]),
              permissions: z.array(z.string()),
            }),
          ),
        }),
        graph: z.object({
          nodes: z.array(
            z.object({
              id: z.string(),
              type: z.string(),
              config: z.record(z.unknown()),
              position: z.object({
                x: z.number(),
                y: z.number(),
              }),
              label: z.string().optional(),
            }),
          ),
          edges: z.array(
            z.object({
              id: z.string(),
              source_id: z.string(),
              target_id: z.string(),
              condition: z.record(z.unknown()).optional(),
              label: z.string().optional(),
            }),
          ),
        }),
        name: z.string(),
        description: z.string(),
        version: z.string(),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    });

    if (!object) {
      throw new Error(`Claude API error: ${finishReason || "Unknown error"}`);
    }

    console.log(usage);

    // Construct agent object from Claude response
    const agent: Agent = {
      id: crypto.randomUUID(),
      name: agentName || object.name || "Unnamed Agent",
      prompt: prompt,
      description: object.description,
      structured_instructions:
        object.structured_instructions as unknown as StructuredInstructions,
      graph: object.graph as unknown as AgentGraph,
      is_public: false,
    };
    return { agent };
  } catch (error) {
    console.error("Error processing agent prompt:", error);
    return {
      agent: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Server action to save an agent to the database
 * @param agent The agent data to save
 * @returns The saved agent with ID
 */
export async function saveAgent(
  agent: Partial<Agent>,
  userID: string,
): Promise<{ agentID: string; error?: string }> {
  const supabase = await createClient();
  try {
    const agentID = agent.id || crypto.randomUUID(); // Use existing ID if available, else generate new

    const agentToSave = {
      ...agent,
      id: agentID,
      user_id: userID,
      updated_at: new Date().toISOString(),
      // Ensure graph and structured_instructions are properly formatted if they exist
      graph: agent.graph ? JSON.parse(JSON.stringify(agent.graph)) : undefined,
      structured_instructions: agent.structured_instructions
        ? JSON.parse(JSON.stringify(agent.structured_instructions))
        : undefined,
      name: agent.name || "Unnamed Agent",
      description: agent.description || "",
      prompt: agent.prompt || "",
    };

    // If created_at is not present, it means it's a new agent or an old one without it
    if (!agent.created_at) {
      agentToSave.created_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("agents")
      .upsert(agentToSave, { onConflict: "id" }); // Use upsert to handle both create and update

    if (error) {
      console.error("Error saving agent to Supabase:", error);
      throw error;
    }

    // Create scheduled trigger if agent has a schedule
    if (agent.structured_instructions?.schedule) {
      const triggerConfig = createScheduledTriggerConfig(
        agent.structured_instructions.schedule,
      );
      if (triggerConfig) {
        const trigger: AgentTrigger = {
          id: crypto.randomUUID(),
          agent_id: agentID,
          user_id: userID,
          trigger_type: "scheduled",
          config: triggerConfig,
          is_active: true,
        };

        const triggerResult = await registerTrigger(trigger);
        if (!triggerResult.success) {
          console.warn(
            "Failed to create scheduled trigger:",
            triggerResult.error,
          );
        }
      }
    }

    revalidatePath("/home/agents");
    revalidatePath(`/home/agents/${agentID}`);
    return { agentID: agentID };
  } catch (error) {
    console.error("Error in saveAgent function:", error);
    return {
      agentID: "",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while saving",
    };
  }
}

/**
 * Server action to fetch all agents for a given user ID
 * @param userId The ID of the user whose agents are to be fetched
 * @returns A list of agents or an error message
 */
export async function getAgentsByUserId(
  userId: string,
): Promise<{ agents: Agent[]; error?: string }> {
  if (!userId) {
    return { agents: [], error: "User ID is required to fetch agents." };
  }
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching agents from Supabase:", error);
      throw error;
    }

    // The data from Supabase needs to be cast to Agent[]
    // Also, ensure that graph and structured_instructions are parsed if stored as JSON strings
    const agents: Agent[] = data
      ? (data.map((item) => ({
          ...item,
          // Supabase might return graph and structured_instructions as objects if they were inserted as such,
          // or as strings if they were stringified. If they are strings, parse them.
          graph:
            typeof item.graph === "string"
              ? JSON.parse(item.graph)
              : item.graph,
          structured_instructions:
            typeof item.structured_instructions === "string"
              ? JSON.parse(item.structured_instructions)
              : item.structured_instructions,
          description: item.description || "", // Ensure description is always a string
        })) as Agent[])
      : [];

    return { agents };
  } catch (error) {
    console.error("Error in getAgentsByUserId function:", error);
    return {
      agents: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while fetching agents",
    };
  }
}

/**
 * Server action to fetch a single agent by its ID and user ID
 * @param agentId The ID of the agent to be fetched
 * @param userId The ID of the user to whom the agent should belong
 * @returns The agent object or an error message
 */
export async function getAgentById(
  agentId: string,
  userId: string,
): Promise<{ agent: Agent | null; error?: string }> {
  if (!agentId) {
    return { agent: null, error: "Agent ID is required." };
  }
  if (!userId) {
    return { agent: null, error: "User ID is required." };
  }

  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", userId) // Ensure the user owns the agent
      .single(); // Expect a single record

    if (error) {
      if (error.code === "PGRST116") {
        // PostgREST error code for "No rows found"
        return { agent: null, error: "Agent not found or access denied." };
      }
      console.error("Error fetching agent from Supabase:", error);
      throw error;
    }

    if (!data) {
      return { agent: null, error: "Agent not found." };
    }

    // The data from Supabase needs to be cast to Agent
    // Also, ensure that graph and structured_instructions are parsed if stored as JSON strings
    const agent: Agent = {
      ...data,
      graph:
        typeof data.graph === "string" ? JSON.parse(data.graph) : data.graph,
      structured_instructions:
        typeof data.structured_instructions === "string"
          ? JSON.parse(data.structured_instructions)
          : data.structured_instructions,
      description: data.description || "", // Ensure description is always a string
    };

    return { agent };
  } catch (error) {
    console.error("Error in getAgentById function:", error);
    return {
      agent: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while fetching the agent",
    };
  }
}

export async function registerTrigger(trigger: AgentTrigger) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("agent_triggers")
      .upsert(
        { ...trigger, config: JSON.stringify(trigger.config) },
        { onConflict: "agent_id" },
      );
    if (error) {
      console.error("Error in registerTrigger function:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in registerTrigger function:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
  revalidatePath("/home/agents");
  return { success: true };
}

export async function deleteAgent(
  agentID: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("agents").delete().eq("id", agentID);
    if (error) {
      console.error("Error in deleteAgent function:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteAgent function:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
  revalidatePath("/home/agents");

  return { success: true };
}

export async function runAgent(agentID: string, userID: string) {
  try {
    const { generateWebhookSignature, getApiUrl } = await import("@/lib/auth");

    if (!agentID || !userID) {
      throw new Error("Missing agentID or userID");
    }

    const payload = JSON.stringify({ agent_id: agentID, user_id: userID });
    const signature = generateWebhookSignature(
      payload,
      process.env.WEBHOOK_SECRET!,
    );

    const response = await fetch(getApiUrl("/trigger"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        Authorization: `Bearer ${process.env.MCP_API_KEY}`,
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`Sandbox responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Agent execution result:", data);
    return data;
  } catch (error) {
    console.error("Error running agent:", error);
    throw error;
  }
}
