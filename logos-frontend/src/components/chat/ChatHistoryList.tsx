"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChatSession, ChatSessionsResponse } from "@/types/chat-persistence";

interface ChatHistoryListProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
}

export function ChatHistoryList({
  onSelectSession,
  currentSessionId,
}: ChatHistoryListProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );
  const router = useRouter();

  // Fetch chat sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/chat/sessions");

      if (!response.ok) {
        throw new Error("Failed to fetch chat sessions");
      }

      const data: ChatSessionsResponse = await response.json();
      setSessions(data.sessions || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching chat sessions:", err);
      setError("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Delete a session
  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent triggering the session selection

    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      // Refresh the list
      await fetchSessions();

      // If the current session was deleted, start a new chat
      if (sessionId === currentSessionId) {
        router.push("/home/chat");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Failed to delete conversation");
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    router.push("/home/chat");
  };

  // Format session preview text
  const getSessionPreview = (session: ChatSession): string => {
    if (session.first_user_message) {
      return session.first_user_message.length > 60
        ? `${session.first_user_message.substring(0, 60)}...`
        : session.first_user_message;
    }
    return "New conversation";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <Button size="sm" onClick={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading chat history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <Button size="sm" onClick={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button size="sm" onClick={handleNewChat}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No chat history found</p>
            <Button onClick={handleNewChat}>
              Start your first conversation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.session_id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                currentSessionId === session.session_id
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
              }`}
              onClick={() => onSelectSession(session.session_id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1 truncate">
                      {getSessionPreview(session)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(session.last_activity), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>•</span>
                      <span>{session.message_count} messages</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                    disabled={deletingSessionId === session.session_id}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
