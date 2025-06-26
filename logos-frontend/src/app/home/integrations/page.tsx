import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { IntegrationsUI } from "@/components/integrations/IntegrationsUI";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch OAuth credentials server-side
  const { data: credentials, error } = await supabase
    .from("oauth_credentials")
    .select("provider")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching OAuth credentials:", error);
    // Handle error appropriately - could redirect to error page
    // or pass error state to client component
    return <div>Error loading integrations</div>;
  }

  // Create a map of enabled integrations
  const enabledIntegrations = new Set(
    credentials?.map((cred) => cred.provider) || [],
  );

  return (
    <IntegrationsUI enabledIntegrations={Array.from(enabledIntegrations)} />
  );
}
