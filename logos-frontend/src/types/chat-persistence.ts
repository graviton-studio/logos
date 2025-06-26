import { type UIMessage } from "@ai-sdk/ui-utils";
import { Tables, TablesInsert, TablesUpdate } from "./supabase";

// More precise type for message parts based on AI SDK structure
export type MessagePart = UIMessage["parts"] extends (infer U)[] ? U : never;

// Union type for all possible message part types
export type MessagePartType = MessagePart["type"];

// Database types (extending Supabase generated types)
export type ChatMessageRecord = Tables<"chat_messages">;
export type ChatMessageInsert = TablesInsert<"chat_messages">;
export type ChatMessageUpdate = TablesUpdate<"chat_messages">;

// Session summary from the view
export type ChatSessionSummary = Tables<"chat_session_summaries">;

// Enhanced types for better developer experience
export interface ChatSession {
  session_id: string;
  user_id: string;
  started_at: string;
  last_activity: string;
  message_count: number;
  first_user_message: string | null;
  last_message: string | null;
}

// Request/response types for API endpoints
export interface ChatSessionsResponse {
  sessions: ChatSession[];
}

export interface ChatSessionResponse {
  messages: UIMessage[];
  session_id: string;
  message_count: number;
}

export interface SaveMessagesRequest {
  messages: UIMessage[];
  session_id?: string; // Optional, will be generated if not provided
}

export interface SaveMessagesResponse {
  session_id: string;
  saved_count: number;
  messages: {
    id: string;
    message_id: string;
    sequence_number: number;
  }[];
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
  session_id: string;
  deleted_count?: number;
}

// Message role types (matching our database constraint)
export type MessageRole = "user" | "assistant" | "system";

// Utility functions for converting between UIMessage and ChatMessageRecord
export interface MessageConversionUtils {
  toDatabase: (
    message: UIMessage,
    userId: string,
    sessionId: string,
    sequenceNumber: number,
  ) => ChatMessageInsert;

  fromDatabase: (record: ChatMessageRecord) => UIMessage;

  toDatabaseBatch: (
    messages: UIMessage[],
    userId: string,
    sessionId: string,
    startingSequence?: number,
  ) => ChatMessageInsert[];

  fromDatabaseBatch: (records: ChatMessageRecord[]) => UIMessage[];
}

// Type guards for runtime validation
export function isChatMessageRecord(obj: unknown): obj is ChatMessageRecord {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === "string" &&
    typeof (obj as Record<string, unknown>).user_id === "string" &&
    typeof (obj as Record<string, unknown>).session_id === "string" &&
    typeof (obj as Record<string, unknown>).message_id === "string" &&
    ["user", "assistant", "system"].includes(
      (obj as Record<string, unknown>).role as string,
    ) &&
    typeof (obj as Record<string, unknown>).sequence_number === "number" &&
    typeof (obj as Record<string, unknown>).timestamp === "string" &&
    typeof (obj as Record<string, unknown>).created_at === "string"
  );
}

export function isUIMessage(obj: unknown): obj is UIMessage {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === "string" &&
    ["user", "assistant", "system"].includes(
      (obj as Record<string, unknown>).role as string,
    ) &&
    Array.isArray((obj as Record<string, unknown>).content)
  );
}

// Error types for chat persistence operations
export class ChatPersistenceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ChatPersistenceError";
  }
}

export const ChatPersistenceErrorCodes = {
  INVALID_USER_ID: "INVALID_USER_ID",
  INVALID_SESSION_ID: "INVALID_SESSION_ID",
  MESSAGE_CONVERSION_FAILED: "MESSAGE_CONVERSION_FAILED",
  DATABASE_ERROR: "DATABASE_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  INVALID_MESSAGE_FORMAT: "INVALID_MESSAGE_FORMAT",
} as const;

export type ChatPersistenceErrorCode =
  (typeof ChatPersistenceErrorCodes)[keyof typeof ChatPersistenceErrorCodes];
