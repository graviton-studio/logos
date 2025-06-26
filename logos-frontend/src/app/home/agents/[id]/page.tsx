import { getAgentById } from "@/app/actions/agent";
import { createClient } from "@/utils/supabase/server";
import { getAgentExecutions } from "@/lib/db";
import { redirect } from "next/navigation";
import EditAgentClientPage from "./edit-agent-client-page";
import { Agent, AgentExecution } from "@/types/agent";

interface EditAgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { id: agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let agent: Agent | null = null;
  let executions: AgentExecution[] = [];

  if (user) {
    const { agent: fetchedAgent, error } = await getAgentById(agentId, user.id);
    if (error) {
      console.error("Error fetching agent:", error);
      // Potentially redirect or show a generic error,
      // but EditAgentClientPage also handles null agent
    } else {
      agent = fetchedAgent;
    }

    // Fetch real agent executions from database
    const { executions: fetchedExecutions, error: executionsError } =
      await getAgentExecutions(agentId);
    if (executionsError) {
      console.error("Error fetching agent executions:", executionsError);
    } else if (fetchedExecutions) {
      executions = fetchedExecutions;
    }
  }

  return <EditAgentClientPage agent={agent} executions={executions} />;
}
