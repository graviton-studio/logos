import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import {
  ChatSessionsResponse,
  ChatSessionSummary,
} from "@/types/chat-persistence";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query the chat_session_summaries view
    const { data: sessions, error } = await supabase
      .from("chat_session_summaries")
      .select("*")
      .eq("user_id", user.id)
      .order("last_activity", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching chat sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch chat sessions" },
        { status: 500 },
      );
    }

    // Filter out sessions with null session_id and transform to our response format
    const validSessions = sessions.filter(
      (session): session is ChatSessionSummary & { session_id: string } =>
        session.session_id !== null,
    );

    const response: ChatSessionsResponse = {
      sessions: validSessions.map((session) => ({
        session_id: session.session_id,
        user_id: session.user_id || user.id,
        started_at: session.started_at || new Date().toISOString(),
        last_activity: session.last_activity || new Date().toISOString(),
        message_count: session.message_count || 0,
        first_user_message: session.first_user_message,
        last_message: session.last_message,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in chat sessions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
