"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getBaseUrl } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";

interface AgentsUIProps {
  userId: string;
}

export function AgentsUI({ userId }: AgentsUIProps) {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAgent = async () => {
    if (!prompt.trim()) {
      setError("Please describe what you want your agent to do");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // We'll implement this API endpoint next
      const response = await fetch(`${getBaseUrl()}/api/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create agent");
      }

      // We'll handle the response and show the graph visualization next
      const agent = await response.json();
      console.log("Created agent:", agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary">AI Agents</h1>
        <p className="text-muted-foreground">
          Create and manage your AI agents using natural language.
        </p>
      </div>

      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle>Create New Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want your agent to do. For example: Check my Gmail every morning for emails with attachments, save those attachments to Google Drive, and add a row to my 'Document Tracker' Google Sheet"
              className="min-h-[120px] bg-input text-foreground border-input focus:ring-ring focus:border-ring"
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={handleCreateAgent}
              disabled={isProcessing || !prompt.trim()}
              variant="default"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground">
              Or use the{" "}
              <button
                onClick={() => {
                  /* We'll implement the visual editor next */
                }}
                className="text-primary hover:underline"
              >
                visual editor
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* We'll add the agent graph visualization here next */}
    </div>
  );
}
