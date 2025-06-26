"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, Puzzle, Plus, List } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";

interface AgentExecution {
  id: string;
  state: string;
  trigger_type: string;
  started_at: string;
  agents: {
    name: string;
  };
}

interface HomeUIProps {
  user: User;
  recentExecutions: AgentExecution[];
}

const getExecutionStatusBadgeVariant = (
  state: string,
): "default" | "outline" | "destructive" | "secondary" => {
  switch (state) {
    case "completed":
      return "default";
    case "running":
      return "secondary";
    case "failed":
      return "destructive";
    case "pending":
      return "outline";
    default:
      return "outline";
  }
};

export default function HomeUI({ user, recentExecutions }: HomeUIProps) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary">
          Welcome back, {user.user_metadata.full_name}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your AI agents today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/home/agents" passHref>
          <Button
            variant="default"
            className="w-full flex items-center justify-center space-x-2 p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1"
          >
            <List className="h-5 w-5" />
            <span>View Agents</span>
          </Button>
        </Link>
        <Link href="/home/chat" passHref>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 p-6 rounded-xl transition-all duration-300 hover:border-primary hover:-translate-y-1"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Start Chat</span>
          </Button>
        </Link>
        <Link href="/home/integrations" passHref>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 p-6 rounded-xl transition-all duration-300 hover:border-primary hover:-translate-y-1"
          >
            <Puzzle className="h-5 w-5" />
            <span>Add Integration</span>
          </Button>
        </Link>
      </div>

      {/* Recent Agents */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-card-foreground">
            Recent Executions
          </h2>
          <Link href="/home/agents/create">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
            >
              Create New Agent
              <Plus className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {recentExecutions.length > 0 ? (
            recentExecutions.map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between p-4 bg-card/80 border border-border rounded-xl shadow-md hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
              >
                <div>
                  <h3 className="font-medium mb-1 text-foreground">
                    {execution.agents.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {execution.trigger_type.charAt(0).toUpperCase() +
                      execution.trigger_type.slice(1)}{" "}
                    • {new Date(execution.started_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={getExecutionStatusBadgeVariant(execution.state)}
                >
                  {execution.state.charAt(0).toUpperCase() +
                    execution.state.slice(1)}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent executions found.</p>
              <p className="text-sm mt-1">
                Create and trigger an agent to see executions here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
