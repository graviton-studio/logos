import { type UIMessage } from "@ai-sdk/ui-utils";
import {
  ChatMessageRecord,
  ChatMessageInsert,
  MessageConversionUtils,
  ChatPersistenceError,
  ChatPersistenceErrorCodes,
  MessagePart,
} from "../types/chat-persistence";
import { Json } from "../types/supabase";

/**
 * Convert UIMessage to database record format
 */
export const uiMessageToChatMessageRecord = (
  message: UIMessage,
  userId: string,
  sessionId: string,
  sequenceNumber: number,
): ChatMessageInsert => {
  try {
    // Handle simple content (string)
    let content: string | null = null;
    if (typeof message.content === "string") {
      content = message.content;
    }

    // Handle complex message parts
    let parts: Json | null = null;
    if (message.parts && Array.isArray(message.parts)) {
      parts = message.parts as Json;
    }

    // Determine timestamp - use createdAt if available, otherwise current time
    const timestamp = message.createdAt
      ? new Date(message.createdAt).toISOString()
      : new Date().toISOString();

    return {
      user_id: userId,
      session_id: sessionId,
      message_id: message.id,
      role: message.role as "user" | "assistant" | "system",
      content,
      parts,
      timestamp,
      sequence_number: sequenceNumber,
    };
  } catch (error) {
    throw new ChatPersistenceError(
      `Failed to convert UIMessage to database record: ${error instanceof Error ? error.message : "Unknown error"}`,
      ChatPersistenceErrorCodes.MESSAGE_CONVERSION_FAILED,
      { messageId: message.id },
    );
  }
};

/**
 * Convert database record back to UIMessage format
 */
export const chatMessageRecordToUIMessage = (
  record: ChatMessageRecord,
): UIMessage => {
  try {
    // Start with base message structure
    const baseMessage = {
      id: record.message_id,
      role: record.role as "user" | "assistant" | "system",
      createdAt: new Date(record.timestamp),
      content: record.content || "", // Provide default empty string for content
    };

    // Handle complex parts - convert from Json to UIMessage parts array
    if (record.parts) {
      return {
        ...baseMessage,
        parts: record.parts as UIMessage["parts"],
      } as UIMessage;
    }

    // For simple messages without parts, return as regular Message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return baseMessage as any;
  } catch (error) {
    throw new ChatPersistenceError(
      `Failed to convert database record to UIMessage: ${error instanceof Error ? error.message : "Unknown error"}`,
      ChatPersistenceErrorCodes.MESSAGE_CONVERSION_FAILED,
      { recordId: record.id },
    );
  }
};

/**
 * Convert multiple UIMessages to database records
 */
export const convertMessagesToRecords = (
  messages: UIMessage[],
  userId: string,
  sessionId: string,
  startingSequence: number = 1,
): ChatMessageInsert[] => {
  try {
    return messages.map((message, index) =>
      uiMessageToChatMessageRecord(
        message,
        userId,
        sessionId,
        startingSequence + index,
      ),
    );
  } catch (error) {
    throw new ChatPersistenceError(
      `Failed to convert messages batch to database records: ${error instanceof Error ? error.message : "Unknown error"}`,
      ChatPersistenceErrorCodes.MESSAGE_CONVERSION_FAILED,
      { messagesCount: messages.length },
    );
  }
};

/**
 * Convert multiple database records to UIMessages
 */
export const convertRecordsToMessages = (
  records: ChatMessageRecord[],
): UIMessage[] => {
  try {
    // Sort by sequence number to ensure correct order
    const sortedRecords = [...records].sort(
      (a, b) => a.sequence_number - b.sequence_number,
    );

    const messages = sortedRecords.map(chatMessageRecordToUIMessage);

    // Ensure all message IDs are unique and properly formatted
    const seenIds = new Set<string>();
    return messages.map((message) => {
      // If we've seen this ID before or it looks like a session ID, generate a new one
      if (seenIds.has(message.id) || !message.id || message.id.length === 36) {
        const newMessage = { ...message, id: generateMessageId() };
        seenIds.add(newMessage.id);
        return newMessage;
      }
      seenIds.add(message.id);
      return message;
    });
  } catch (error) {
    throw new ChatPersistenceError(
      `Failed to convert database records to messages batch: ${error instanceof Error ? error.message : "Unknown error"}`,
      ChatPersistenceErrorCodes.MESSAGE_CONVERSION_FAILED,
      { recordsCount: records.length },
    );
  }
};

/**
 * Generate a new session ID using crypto.randomUUID()
 */
export const generateSessionId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments where crypto.randomUUID() is not available
    return (
      "session-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 15)
    );
  }
};

/**
 * Generate a unique message ID
 */
export const generateMessageId = (): string => {
  try {
    return `msg-${crypto.randomUUID()}`;
  } catch {
    // Fallback for environments where crypto.randomUUID() is not available
    return (
      "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 15)
    );
  }
};

/**
 * Ensure message ID is unique and not accidentally a session ID
 */
export const ensureUniqueMessageId = (
  message: UIMessage,
  sessionId: string,
): UIMessage => {
  // If message ID is missing, empty, or accidentally set to session ID, generate a new one
  if (!message.id || message.id === sessionId || message.id.length === 36) {
    return {
      ...message,
      id: generateMessageId(),
    };
  }
  return message;
};

/**
 * Validate that a message has all required fields for persistence
 */
export const validateMessageForPersistence = (message: UIMessage): boolean => {
  return !!(
    message.id &&
    message.role &&
    ["user", "assistant", "system"].includes(message.role) &&
    (message.content || message.parts)
  );
};

/**
 * Extract the first user message content for session summaries
 */
export const extractFirstUserMessage = (
  messages: UIMessage[],
): string | null => {
  const firstUserMsg = messages.find((msg) => msg.role === "user");
  if (!firstUserMsg) return null;

  // If it has simple content, return that
  if (typeof firstUserMsg.content === "string") {
    return firstUserMsg.content.substring(0, 100); // Limit length for summary
  }

  // If it has parts, try to extract text from the first text part
  if (firstUserMsg.parts && Array.isArray(firstUserMsg.parts)) {
    const textPart = firstUserMsg.parts.find((part) => part.type === "text") as
      | MessagePart
      | undefined;
    if (textPart && "text" in textPart) {
      return (textPart.text as string).substring(0, 100);
    }
  }

  return "Complex message"; // Fallback for complex messages without text
};

/**
 * Extract the last message content for session summaries
 */
export const extractLastMessage = (messages: UIMessage[]): string | null => {
  if (messages.length === 0) return null;

  const lastMsg = messages[messages.length - 1];

  // If it has simple content, return that
  if (typeof lastMsg.content === "string") {
    return lastMsg.content.substring(0, 100);
  }

  // If it has parts, try to extract text from the first text part
  if (lastMsg.parts && Array.isArray(lastMsg.parts)) {
    const textPart = lastMsg.parts.find((part) => part.type === "text") as
      | MessagePart
      | undefined;
    if (textPart && "text" in textPart) {
      return (textPart.text as string).substring(0, 100);
    }
  }

  return `${lastMsg.role} message`; // Fallback
};

/**
 * Implementation of the MessageConversionUtils interface
 */
export const messageConversionUtils: MessageConversionUtils = {
  toDatabase: uiMessageToChatMessageRecord,
  fromDatabase: chatMessageRecordToUIMessage,
  toDatabaseBatch: convertMessagesToRecords,
  fromDatabaseBatch: convertRecordsToMessages,
};

/**
 * Utility to check if messages need to be persisted (have changed)
 */
export const shouldPersistMessages = (
  currentMessages: UIMessage[],
  lastPersistedCount: number,
): boolean => {
  return currentMessages.length > lastPersistedCount;
};

/**
 * Filter out system messages that shouldn't be persisted
 */
export const filterMessagesForPersistence = (
  messages: UIMessage[],
): UIMessage[] => {
  return messages.filter((message) => {
    // Skip system messages that are just initialization
    if (message.role === "system" && message.id?.includes("system-")) {
      return false;
    }

    // Skip initial assistant messages that are just greetings
    if (
      message.role === "assistant" &&
      message.id?.includes("initial-assistant-")
    ) {
      return false;
    }

    return validateMessageForPersistence(message);
  });
};
