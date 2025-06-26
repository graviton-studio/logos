"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Plus,
  Zap,
  Eye,
  MoreHorizontal,
  Clock,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { FaFont } from "react-icons/fa";
import { Agent } from "@/types/agent";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { getAgentsByUserId, runAgent } from "@/app/actions/agent";
import useUser from "@/lib/hooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteAgent } from "@/app/actions/agent";

export default function AgentsPage() {
  const { user, loading: userLoading } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !userLoading) {
      const fetchAgents = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await getAgentsByUserId(user.id);
          if (result.error) {
            setError(result.error);
            setAgents([]);
          } else {
            setAgents(result.agents || []);
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "An unknown error occurred while fetching agents.",
          );
          setAgents([]);
        }
        setIsLoading(false);
      };
      fetchAgents();
    } else if (!userLoading && !user) {
      setIsLoading(false);
      setError("You must be logged in to view agents.");
      setAgents([]);
    }
  }, [user, userLoading]);

  const getAgentStatusBadgeVariant = (
    status: Agent["status"],
  ): "default" | "outline" | "destructive" | "secondary" => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "outline";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleRunAgent = async (
    agentId: string,
    userID: string | undefined,
  ) => {
    if (!userID) {
      throw new Error("User ID not found");
    }
    setRunningAgentId(agentId);
    try {
      await runAgent(agentId, userID);
    } catch (err) {
      console.error("Error running agent:", err);
    } finally {
      setRunningAgentId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-primary">Your Agents</h1>
          <p className="text-muted-foreground">
            Manage and monitor your AI agents
          </p>
        </div>
        <Link href="/home/agents/create" passHref>
          <Button
            variant="default"
            className="flex items-center gap-2 transition-all duration-300 hover:shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading agents...</p>
        </div>
      )}

      {error && !isLoading && (
        <Alert
          variant={
            error === "You must be logged in to view agents."
              ? "default"
              : "destructive"
          }
          className="mb-8"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {error === "You must be logged in to view agents."
              ? "Authentication Required"
              : "Error"}
          </AlertTitle>
          <AlertDescription>
            {error}
            {error === "You must be logged in to view agents." && (
              <Link href="/login" className="mt-2 block">
                <Button variant="default" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && agents.length === 0 && (
        <div className="text-center py-10">
          <FaFont className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            No agents found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new agent.
          </p>
          <div className="mt-6">
            <Link href="/home/agents/create" passHref>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!isLoading && !error && agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col justify-between h-full p-6 bg-card/80 border border-border rounded-xl shadow-md hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
            >
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center max-w-4/5">
                    <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/20 text-primary mr-3">
                      <FaFont className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {agent.structured_instructions?.objective
                          ? "AI Agent"
                          : "Basic Agent"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-popover border-border text-popover-foreground"
                    >
                      <DropdownMenuItem
                        className="hover:bg-accent focus:bg-accent cursor-pointer"
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete agent "${agent.name}"?`,
                            )
                          ) {
                            try {
                              await deleteAgent(agent.id);
                              setAgents((prevAgents) =>
                                prevAgents.filter((a) => a.id !== agent.id),
                              );
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? `Failed to delete agent: ${err.message}`
                                  : "An unknown error occurred while deleting the agent.",
                              );
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                        <span className="text-destructive">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-muted-foreground mb-4 overflow-hidden line-clamp-3">
                  {agent.prompt}
                </p>
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    Updated{" "}
                    {agent.updated_at
                      ? formatDistanceToNow(new Date(agent.updated_at), {
                          addSuffix: true,
                        })
                      : "N/A"}
                  </div>
                  <Badge
                    variant={getAgentStatusBadgeVariant(agent.status)}
                    className="capitalize"
                  >
                    {agent.is_public ? "Public" : "Private"}
                  </Badge>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => handleRunAgent(agent.id, user?.id)}
                    disabled={runningAgentId === agent.id}
                    size="sm"
                    variant="default"
                    className="flex-1"
                  >
                    {runningAgentId === agent.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    {runningAgentId === agent.id ? "Running..." : "Run Agent"}
                  </Button>
                  <Link href={`/home/agents/${agent.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
