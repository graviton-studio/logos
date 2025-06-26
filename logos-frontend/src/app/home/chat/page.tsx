import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ChatUI } from "@/components/chat/ChatUI";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's enabled integrations
  const { data: credentials } = await supabase
    .from("oauth_credentials")
    .select("provider")
    .eq("user_id", user.id);

  const enabledIntegrations = credentials?.map((cred) => cred.provider) || [];

  return <ChatUI userId={user.id} enabledIntegrations={enabledIntegrations} />;
}
