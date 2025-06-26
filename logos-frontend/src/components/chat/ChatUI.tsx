"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { Plus, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { MessageList } from "./MessageList";
import { ChatInputBar } from "./ChatInputBar";
import { ChatHistorySheet } from "./ChatHistorySheet";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { generateSessionId } from "@/utils/chat-persistence";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { type UIMessage } from "@ai-sdk/ui-utils";

interface ChatUIProps {
  userId: string;
  enabledIntegrations: string[];
  initialSessionId?: string;
  initialMessages?: UIMessage[];
}

interface AttachedFile {
  file: File;
  content: string;
  type: string;
}

export function ChatUI({
  userId,
  enabledIntegrations,
  initialSessionId,
  initialMessages,
}: ChatUIProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>(
    initialSessionId || generateSessionId(),
  );

  // Create default messages if no initial messages provided
  const defaultMessages = [
    {
      id: `system-${sessionId}`,
      role: "system",
      content: `You are an intelligent AI assistant helping with various tasks. Provide clear, concise responses.
        
User Information:
        - User ID: ${userId}
        - Today's date: ${new Date().toLocaleDateString()}
        - Enabled integrations: ${enabledIntegrations.length > 0 ? enabledIntegrations.join(", ") : "none"}
        
Available integrations: gcal (Google Calendar), gmail (Gmail), gsheets (Google Sheets), airtable (Airtable), slack (Slack)
        
IMPORTANT: Only use the request_access tool if the user asks for something that requires an integration they don't have enabled. Check the enabled integrations list first.`,
    },
    {
      id: `initial-assistant-${sessionId}`,
      role: "assistant",
      content: "What great things are we going to achieve today?",
    },
  ] as UIMessage[];

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    error: chatError,
    append,
  } = useChat({
    api: "/api/completion",
    initialMessages: initialMessages || defaultMessages,
    onError: (error) => {
      console.error("Chat completion error:", error);
    },
  });

  // Auto-save functionality
  const {
    isSaving,
    lastSaved,
    error: saveError,
    forceSave,
    clearError,
  } = useAutoSave({
    messages: aiMessages,
    sessionId,
    debounceMs: 2000, // Save after 2 seconds of inactivity
    enabled: true, // Re-enabled - API now prevents duplicates
  });

  const formSubmitHandler = (
    e: React.FormEvent<HTMLFormElement> & { attachedFiles?: AttachedFile[] },
  ) => {
    e.preventDefault();

    console.log("=== ChatUI formSubmitHandler Debug ===");
    console.log("Event:", e);
    console.log("Has attachedFiles:", !!e.attachedFiles);
    console.log("attachedFiles:", e.attachedFiles);
    console.log("Input:", input);

    // Check if there are file attachments
    const attachedFiles = e.attachedFiles || [];

    if (attachedFiles.length > 0) {
      console.log("Processing files...");
      // Create a message with file parts
      const messageContent = input.trim();
      const parts: UIMessage["parts"] = [];

      // Add text part if there's text input
      if (messageContent) {
        parts.push({
          type: "text",
          text: messageContent,
        });
      }

      // Add file parts
      attachedFiles.forEach((attachedFile, index) => {
        console.log(`Adding file part ${index}:`, {
          name: attachedFile.file.name,
          type: attachedFile.type,
          contentLength: attachedFile.content.length,
        });
        parts.push({
          type: "file",
          data: attachedFile.content,
          mimeType: attachedFile.type,
        });
      });

      // Create a new message with parts
      const newMessage: UIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageContent || "Shared files",
        parts: parts,
        createdAt: new Date(),
      };

      console.log("Created message with parts:", newMessage);

      // Use append to add the message
      append(newMessage);
    } else {
      console.log("No files attached, handling normal submission");
      // Handle normal text submission
      handleSubmit(e);
    }
  };

  const handleNewChat = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setMessages(defaultMessages);
    router.push("/home/chat");
  };

  const handleSelectSession = (selectedSessionId: string) => {
    router.push(`/home/chat/${selectedSessionId}`);
  };

  return (
    <div className="h-screen flex flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold animate-slideInLeft text-primary">
            Chat
          </h1>
          <SaveStatusIndicator
            isSaving={isSaving}
            lastSaved={lastSaved}
            error={saveError}
            onRetry={forceSave}
            onClearError={clearError}
            className="animate-fadeIn delay-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <ChatHistorySheet
            onSelectSession={handleSelectSession}
            currentSessionId={sessionId}
            triggerClassName="animate-fadeIn delay-100"
          />
          <Button
            variant="outline"
            className="animate-fadeIn delay-200"
            onClick={handleNewChat}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto pb-24">
        {chatError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Connection Error
              </p>
              <p className="text-sm text-red-600 mt-1">
                Unable to connect to the AI service. Please check your
                connection and try again.
              </p>
              <p className="text-xs text-red-500 mt-2 font-mono">
                {chatError.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={() => window.location.reload()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <MessageList messages={aiMessages} isLoading={isLoading} />
      </div>

      <ChatInputBar
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={formSubmitHandler}
        isLoading={isLoading}
      />
    </div>
  );
}
