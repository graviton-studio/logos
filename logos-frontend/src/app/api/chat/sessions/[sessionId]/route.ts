import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  ChatSessionResponse,
  ChatMessageRecord,
  DeleteSessionResponse,
} from "@/types/chat-persistence";
import { convertRecordsToMessages } from "@/utils/chat-persistence";

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query the chat_messages table for this session
    const { data: messageRecords, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("sequence_number", { ascending: true });

    if (error) {
      console.error("Error fetching chat messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch chat messages" },
        { status: 500 },
      );
    }

    if (!messageRecords || messageRecords.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Convert database records to UIMessage objects
    const messages = convertRecordsToMessages(
      messageRecords as ChatMessageRecord[],
    );

    const response: ChatSessionResponse = {
      messages,
      session_id: sessionId,
      message_count: messages.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in chat session API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, verify the session exists and belongs to the user
    const { data: sessionCheck, error: checkError } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .limit(1);

    if (checkError) {
      console.error("Error checking session ownership:", checkError);
      return NextResponse.json(
        { error: "Failed to verify session ownership" },
        { status: 500 },
      );
    }

    if (!sessionCheck || sessionCheck.length === 0) {
      return NextResponse.json(
        { error: "Session not found or not owned by user" },
        { status: 404 },
      );
    }

    // Count messages before deletion for response
    const { count: messageCount } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

    // Delete all messages in the session
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting chat session:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete chat session" },
        { status: 500 },
      );
    }

    const response: DeleteSessionResponse = {
      success: true,
      message: "Chat session deleted successfully",
      session_id: sessionId,
      deleted_count: messageCount || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in delete session API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
