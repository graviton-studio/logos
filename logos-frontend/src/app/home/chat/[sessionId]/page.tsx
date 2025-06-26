import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChatUI } from "@/components/chat/ChatUI";
import { convertRecordsToMessages } from "@/utils/chat-persistence";
import { ChatMessageRecord } from "@/types/chat-persistence";

interface ChatSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ChatSessionPage({
  params,
}: ChatSessionPageProps) {
  const { sessionId } = await params;
  const supabase = await createClient();

  // Check authentication
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

  // If sessionId is "new", redirect to the base chat page for a new chat
  if (sessionId === "new") {
    redirect("/home/chat");
  }

  // Load session messages if sessionId is provided
  let initialMessages = undefined;
  let sessionExists = false;

  if (sessionId && sessionId !== "new") {
    try {
      // Fetch messages for this session
      const { data: messageRecords, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .order("sequence_number", { ascending: true });

      if (error) {
        console.error("Error loading session:", error);
      } else if (messageRecords && messageRecords.length > 0) {
        sessionExists = true;
        // Convert database records to UIMessages
        const uiMessages = convertRecordsToMessages(
          messageRecords as ChatMessageRecord[],
        );
        initialMessages = uiMessages;
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  }

  // If session doesn't exist, redirect to new chat
  if (sessionId && sessionId !== "new" && !sessionExists) {
    redirect("/home/chat");
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="text-lg">Loading conversation...</div>
        </div>
      }
    >
      <ChatUI
        userId={user.id}
        enabledIntegrations={enabledIntegrations}
        initialSessionId={sessionId}
        initialMessages={initialMessages}
      />
    </Suspense>
  );
}
