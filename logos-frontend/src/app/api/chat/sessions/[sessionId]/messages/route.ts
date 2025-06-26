import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SaveMessagesRequest } from "@/types/chat-persistence";
import {
  convertMessagesToRecords,
  generateSessionId,
  filterMessagesForPersistence,
  validateMessageForPersistence,
} from "@/utils/chat-persistence";

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId: rawSessionId } = await params;

    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: SaveMessagesRequest = await request.json();

    if (
      !body.messages ||
      !Array.isArray(body.messages) ||
      body.messages.length === 0
    ) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    // Determine the actual session ID
    let sessionId = rawSessionId;
    if (sessionId === "new") {
      sessionId = body.session_id || generateSessionId();
    }

    // Filter and validate messages for persistence
    const filteredMessages = filterMessagesForPersistence(body.messages);
    const invalidMessages = filteredMessages.filter(
      (msg) => !validateMessageForPersistence(msg),
    );

    if (invalidMessages.length > 0) {
      return NextResponse.json(
        {
          error: "Some messages are invalid for persistence",
          details: { invalidMessageIds: invalidMessages.map((m) => m.id) },
        },
        { status: 400 },
      );
    }

    if (filteredMessages.length === 0) {
      return NextResponse.json(
        {
          error: "No valid messages to persist",
        },
        { status: 400 },
      );
    }

    // Get existing message IDs to avoid duplicates
    const { data: existingMessages, error: existingError } = await supabase
      .from("chat_messages")
      .select("message_id, sequence_number")
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

    if (existingError) {
      console.error("Error fetching existing messages:", existingError);
      return NextResponse.json(
        {
          error: "Failed to check existing messages",
        },
        { status: 500 },
      );
    }

    const existingMessageIds = new Set(
      existingMessages?.map((msg) => msg.message_id) || [],
    );

    // Filter out messages that already exist
    const newMessages = filteredMessages.filter(
      (msg) => !existingMessageIds.has(msg.id),
    );

    if (newMessages.length === 0) {
      return NextResponse.json({
        success: true,
        session_id: sessionId,
        message_count: 0,
        filtered_count: body.messages.length - filteredMessages.length,
        inserted_ids: [],
        message: "No new messages to save",
      });
    }

    const maxSeq =
      existingMessages && existingMessages.length > 0
        ? Math.max(...existingMessages.map((msg) => msg.sequence_number))
        : 0;

    const startSeq = maxSeq + 1;

    // Convert UIMessages to database records
    const messageRecords = convertMessagesToRecords(
      newMessages,
      user.id,
      sessionId,
      startSeq,
    );

    // Insert messages into the database
    const { data: insertedData, error: insertError } = await supabase
      .from("chat_messages")
      .insert(messageRecords)
      .select();

    if (insertError) {
      console.error("Error saving chat messages:", insertError);
      return NextResponse.json(
        {
          error: "Failed to save chat messages",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      message_count: messageRecords.length,
      filtered_count: body.messages.length - filteredMessages.length,
      inserted_ids: insertedData?.map((record) => record.id) || [],
    });
  } catch (error) {
    console.error("Unexpected error in save messages API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
