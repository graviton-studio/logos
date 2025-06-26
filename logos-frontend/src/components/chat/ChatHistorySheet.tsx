"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Plus, MessageSquare, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSession, ChatSessionsResponse } from "@/types/chat-persistence";

interface ChatHistorySheetProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
  triggerClassName?: string;
}

export function ChatHistorySheet({
  onSelectSession,
  currentSessionId,
  triggerClassName,
}: ChatHistorySheetProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/chat/sessions");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view your chat history");
        }
        throw new Error(`Failed to load chat sessions: ${response.status}`);
      }

      const data: ChatSessionsResponse = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to fetch chat sessions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load chat sessions",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this chat session? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(sessionId);

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`);
      }

      // Remove from local state optimistically
      setSessions((prev) =>
        prev.filter((session) => session.session_id !== sessionId),
      );

      // If we deleted the current session, redirect to new chat
      if (sessionId === currentSessionId) {
        router.push("/home/chat");
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert(err instanceof Error ? err.message : "Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setOpen(false); // Close the sheet after selection
  };

  const handleNewChat = () => {
    router.push("/home/chat");
    setOpen(false); // Close the sheet
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <History className="h-4 w-4" />
          <span className="sr-only">Chat History</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
          <SheetDescription>
            View and manage your previous conversations
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Start New Chat
          </Button>

          {/* Sessions List */}
          <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
            <div className="space-y-2 pr-4">
              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading chat history...
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-destructive mb-2">{error}</p>
                  <Button onClick={fetchSessions} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              )}

              {/* No sessions state */}
              {!loading && !error && sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No chat history yet</p>
                  <p className="text-xs mt-1">
                    Start a conversation to see it here
                  </p>
                </div>
              )}

              {/* Sessions list */}
              {!loading &&
                !error &&
                sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className={`group cursor-pointer rounded-lg border p-2 transition-colors hover:bg-accent/50 ${
                      session.session_id === currentSessionId
                        ? "ring-2 ring-primary bg-accent/30"
                        : ""
                    }`}
                    onClick={() => handleSelectSession(session.session_id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 max-w-[280px]">
                        <p className="text-sm font-medium truncate leading-tight">
                          {session.first_user_message &&
                          session.first_user_message.length > 45
                            ? `${session.first_user_message.substring(0, 45)}...`
                            : session.first_user_message || "New conversation"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(
                              new Date(session.last_activity),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                          <span>•</span>
                          <span>
                            {session.message_count} msg
                            {session.message_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity shrink-0"
                        onClick={(e) =>
                          handleDeleteSession(session.session_id, e)
                        }
                        disabled={deletingId === session.session_id}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Delete session</span>
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
