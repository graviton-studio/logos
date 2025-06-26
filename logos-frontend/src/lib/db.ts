import { createClient } from "@/utils/supabase/server";
import { AgentExecution, AgentExecutionLog, AgentTrigger } from "@/types/agent";
import { Database } from "@/types/supabase";

export async function getAvailableTools() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("agent_tools").select("*");
  if (error) {
    console.error("Error fetching tools:", error);
    return [];
  }
  return data;
}

export async function getAgentExecutions(
  agentId: string,
): Promise<{ executions: AgentExecution[] | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_executions")
    .select("*")
    .eq("agent_id", agentId)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Error fetching agent executions:", error);
    return { executions: null, error: error.message };
  }

  const executions: AgentExecution[] = data.map((exec) => ({
    id: exec.id,
    agent_id: exec.agent_id,
    trigger_id: exec.trigger_id || undefined,
    trigger_type: exec.trigger_type as AgentExecution["trigger_type"],
    trigger_context: exec.initial_context as
      | Record<string, unknown>
      | undefined,
    state: exec.state as AgentExecution["state"],
    result: exec.final_outputs as Record<string, unknown> | undefined,
    error: exec.error_message || undefined,
    started_at: exec.started_at,
    completed_at: exec.completed_at || undefined,
    created_at: exec.created_at || undefined,
  }));

  return { executions, error: null };
}

export async function getExecutionLogs(
  executionId: string,
): Promise<{ logs: AgentExecutionLog[] | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_execution_logs")
    .select("*")
    .eq("execution_id", executionId)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error fetching execution logs:", error);
    return { logs: null, error: error.message };
  }

  const logs: AgentExecutionLog[] = data.map((log) => ({
    id: log.id,
    execution_id: log.execution_id,
    log_type: log.log_type as AgentExecutionLog["log_type"],
    content: log.content as Record<string, unknown>,
    timestamp: log.timestamp,
    created_at: log.created_at || undefined,
  }));

  return { logs, error: null };
}

export async function getAgentExecution(
  executionId: string,
): Promise<{ execution: AgentExecution | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_executions")
    .select("*")
    .eq("id", executionId)
    .single();

  if (error) {
    console.error("Error fetching agent execution:", error);
    return { execution: null, error: error.message };
  }

  const execution: AgentExecution = {
    id: data.id,
    agent_id: data.agent_id,
    trigger_id: data.trigger_id || undefined,
    trigger_type: data.trigger_type as AgentExecution["trigger_type"],
    trigger_context: data.initial_context as
      | Record<string, unknown>
      | undefined,
    state: data.state as AgentExecution["state"],
    result: data.final_outputs as Record<string, unknown> | undefined,
    error: data.error_message || undefined,
    started_at: data.started_at,
    completed_at: data.completed_at || undefined,
    created_at: data.created_at || undefined,
  };

  return { execution, error: null };
}

/**
 * Get all active triggers for scheduled execution
 */
export async function getActiveScheduledTriggers(): Promise<{
  triggers: AgentTrigger[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_triggers")
    .select("*")
    .eq("is_active", true)
    .eq("trigger_type", "scheduled");

  if (error) {
    console.error("Error fetching scheduled triggers:", error);
    return { triggers: null, error: error.message };
  }

  const triggers: AgentTrigger[] = data
    .filter((trigger) => trigger.user_id !== null)
    .map((trigger) => ({
      id: trigger.id,
      agent_id: trigger.agent_id,
      user_id: trigger.user_id!,
      trigger_type: trigger.trigger_type as AgentTrigger["trigger_type"],
      config:
        typeof trigger.config === "string"
          ? JSON.parse(trigger.config)
          : trigger.config,
      is_active: trigger.is_active,
      created_at: trigger.created_at,
      updated_at: trigger.updated_at,
    }));

  return { triggers, error: null };
}

/**
 * Create a new agent execution record
 */
export async function createAgentExecution(
  execution: Omit<AgentExecution, "id" | "created_at">,
): Promise<{
  execution_id: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const insertData: Database["public"]["Tables"]["agent_executions"]["Insert"] =
    {
      agent_id: execution.agent_id,
      trigger_id: execution.trigger_id || null,
      trigger_type: execution.trigger_type,
      initial_context:
        (execution.trigger_context as Database["public"]["Tables"]["agent_executions"]["Insert"]["initial_context"]) ||
        null,
      state: execution.state,
      final_outputs:
        (execution.result as Database["public"]["Tables"]["agent_executions"]["Insert"]["final_outputs"]) ||
        null,
      error_message: execution.error || null,
      started_at: execution.started_at,
      completed_at: execution.completed_at || null,
    };

  const { data, error } = await supabase
    .from("agent_executions")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating agent execution:", error);
    return { execution_id: null, error: error.message };
  }

  return { execution_id: data.id, error: null };
}
