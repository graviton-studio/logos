import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import HomeUI from "@/components/home/HomeUI";

async function getRecentExecutions(userId: string) {
  const supabase = await createClient();

  const { data: executions, error } = await supabase
    .from("agent_executions")
    .select(
      `
      id,
      state,
      trigger_type,
      started_at,
      agents!inner(name)
    `,
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching recent executions:", error);
    return [];
  }

  return executions || [];
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const recentExecutions = await getRecentExecutions(user.id);

  return <HomeUI user={user} recentExecutions={recentExecutions} />;
}
