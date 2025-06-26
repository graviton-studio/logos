"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type UIMessage } from "@ai-sdk/ui-utils";
import { MessageCard } from "./MessageCard";
import { FaFont } from "react-icons/fa";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const filteredMessages = messages.filter(
    (message) => message.role !== "system",
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-6 overflow-x-auto space-y-4">
        {filteredMessages.map((message, index) => {
          const isUser = message.role === "user";
          // Use a combination of message ID and index to ensure uniqueness
          const uniqueKey = message.id
            ? `${message.id}-${index}`
            : `message-${index}`;
          return (
            <MessageCard key={uniqueKey} message={message} isUser={isUser} />
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FaFont className="h-4 w-4 text-black" />
            </div>
            <div className="rounded-lg p-4 bg-muted">
              <div className="flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75"></div>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
