"use server";

import { getAgentExecution } from "@/lib/db";

export async function getExecutionAction(executionId: string) {
  try {
    const { execution, error } = await getAgentExecution(executionId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, execution };
  } catch (error) {
    console.error("Error in getExecutionAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch execution",
    };
  }
}
