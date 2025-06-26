import { useEffect, useRef, useState, useCallback } from "react";
import { type UIMessage } from "@ai-sdk/ui-utils";

interface UseAutoSaveOptions {
  messages: UIMessage[];
  sessionId: string;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  forceSave: () => Promise<void>;
  clearError: () => void;
}

export function useAutoSave({
  messages,
  sessionId,
  debounceMs = 2000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedMessagesCount = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save messages function
  const saveMessages = useCallback(
    async (messagesToSave: UIMessage[], signal?: AbortSignal) => {
      try {
        // Import the filter function to check if we have any valid messages to save
        const { filterMessagesForPersistence } = await import(
          "@/utils/chat-persistence"
        );
        const filteredMessages = filterMessagesForPersistence(messagesToSave);

        // If no valid messages to persist, don't make the request
        if (filteredMessages.length === 0) {
          return;
        }

        setIsSaving(true);
        setError(null);

        const response = await fetch(
          `/api/chat/sessions/${sessionId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: messagesToSave,
            }),
            signal,
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required. Please log in again.");
          }
          if (response.status === 403) {
            throw new Error(
              "Access denied. You can only save your own messages.",
            );
          }
          console.log(response);
          throw new Error(
            `Failed to save messages: ${response.status} ${response.statusText}`,
          );
        }

        const result = await response.json();
        lastSavedMessagesCount.current = messagesToSave.length;
        setLastSaved(new Date());

        return result;
      } catch (err) {
        // Don't set error if request was aborted (component unmounting)
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Error saving messages:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error during save";
        setError(new Error(errorMessage));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [sessionId],
  );

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled || !sessionId || messages.length === 0) {
      return;
    }

    // Only save if we have new messages
    if (messages.length <= lastSavedMessagesCount.current) {
      return;
    }

    // Clear any existing timeout and abort controller
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set a new timeout for debouncing
    timeoutRef.current = setTimeout(async () => {
      // Create new abort controller for this save operation
      abortControllerRef.current = new AbortController();

      try {
        await saveMessages(messages, abortControllerRef.current.signal);
      } catch {
        // Error is already handled in saveMessages
      }
    }, debounceMs);
  }, [messages, sessionId, debounceMs, enabled, saveMessages]);

  // Force save function for manual saving
  const forceSave = async () => {
    if (!enabled || !sessionId || messages.length === 0) {
      return;
    }

    // Clear any pending auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this save operation
    abortControllerRef.current = new AbortController();

    await saveMessages(messages, abortControllerRef.current.signal);
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  return {
    isSaving,
    lastSaved,
    error,
    forceSave,
    clearError,
  };
}
