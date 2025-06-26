"use client";

import { Agent, AgentExecution } from "@/types/agent";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ListChecks,
  Network,
  AlertCircle,
  CheckCircle2,
  Loader2, // For running state
  Clock, // For pending/timestamps
  Eye, // For view details
  Save, // For save icon
} from "lucide-react";
import Link from "next/link";
import AgentFlow from "@/components/flow/AgentFlow";
import ExecutionLogsModal from "@/components/agents/ExecutionLogsModal";
import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { FaFont } from "react-icons/fa";
import { saveAgent } from "@/app/actions/agent";
import { useToast } from "@/lib/hooks/use-toast";
import useUser from "@/lib/hooks";
import { AgentProvider, useAgent } from "@/contexts/AgentContext";

interface EditAgentClientPageProps {
  agent: Agent | null;
  executions: AgentExecution[];
}

type Tab = "flow" | "runs";

function EditAgentContent({ executions }: { executions: AgentExecution[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("flow");
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useUser();
  const { toast, toasts, dismiss } = useToast();
  const { agent, hasUnsavedChanges, resetChanges } = useAgent();

  const handleSaveChanges = useCallback(async () => {
    if (!agent || !user) {
      toast({
        message: "Unable to save: Agent or user not found",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveAgent(agent, user.id);

      if (result.agentID && !result.error) {
        toast({
          message: "Agent saved successfully",
          variant: "success",
        });
        resetChanges();
      } else {
        toast({
          message: result.error || "Failed to save agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving agent:", error);
      toast({
        message: "An unexpected error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [agent, user, toast, resetChanges]);

  if (!agent) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-[var(--background)] to-[var(--muted)] text-foreground p-4">
        <Card className="max-w-md w-full p-8 bg-card border border-border rounded-xl shadow-lg text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <FaFont className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3">Agent Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The agent you are looking for does not exist or you do not have
            permission to view it.
          </p>
          <Link href="/home/agents">
            <Button variant="default" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: AgentExecution["state"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (
    status: AgentExecution["state"],
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "running":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[var(--background)] to-[var(--muted)] text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/home/agents">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to Agents"
              className="hover:bg-background/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/10 text-primary transition-transform duration-200 hover:scale-105">
              <FaFont className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{agent.name}</h1>
              <p className="text-sm text-muted-foreground">Edit Agent</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            disabled={!hasUnsavedChanges || isSaving}
            onClick={handleSaveChanges}
            className={cn(
              "shadow-sm hover:shadow-md transition-all duration-200",
              !hasUnsavedChanges && "opacity-50 cursor-not-allowed",
              isSaving && "opacity-75",
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-[73px] z-10">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "flow" ? "default" : "outline"}
            onClick={() => setActiveTab("flow")}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              activeTab === "flow" && "shadow-sm hover:shadow-md",
            )}
          >
            <Network className="h-4 w-4" />
            Flow
            {hasUnsavedChanges && activeTab === "flow" && (
              <div className="w-2 h-2 bg-orange-500 rounded-full ml-1" />
            )}
          </Button>
          <Button
            variant={activeTab === "runs" ? "default" : "outline"}
            onClick={() => setActiveTab("runs")}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              activeTab === "runs" && "shadow-sm hover:shadow-md",
            )}
          >
            <ListChecks className="h-4 w-4" />
            Runs ({executions.length})
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === "flow" && (
          <div className="h-full">
            <AgentFlow />
          </div>
        )}
        {activeTab === "runs" && (
          <div className="p-6 space-y-6">
            {executions.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-10 bg-card border border-border rounded-xl shadow-lg">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <ListChecks className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Runs Yet
                </h3>
                <p className="text-muted-foreground">
                  This agent hasn&apos;t been run or has no execution history.
                </p>
              </Card>
            ) : (
              <ul className="space-y-4">
                {executions.map((exec) => (
                  <Card
                    key={exec.id}
                    className="p-4 bg-card/80 border border-border rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="transition-transform duration-200 hover:scale-105">
                          {getStatusIcon(exec.state)}
                        </div>
                        <span className="font-semibold text-foreground">
                          Run {exec.id.substring(0, 8)}...
                        </span>
                        <Badge
                          variant={getStatusBadgeVariant(exec.state)}
                          className="capitalize"
                        >
                          {exec.state}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedExecutionId(exec.id)}
                        className="hover:bg-muted/50 transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Triggered:</span>{" "}
                        {exec.trigger_type}
                        {exec.trigger_context && (
                          <span className="ml-1 text-xs text-muted-foreground/80">
                            (
                            {Object.entries(exec.trigger_context)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                            )
                          </span>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Started:</span>{" "}
                        {formatDistanceToNow(new Date(exec.started_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </Card>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Execution Logs Modal */}
      {selectedExecutionId && (
        <ExecutionLogsModal
          executionId={selectedExecutionId}
          isOpen={!!selectedExecutionId}
          onClose={() => setSelectedExecutionId(null)}
        />
      )}

      {/* Toast Container */}
      {toasts.map((toastItem) => (
        <Toast
          key={toastItem.id}
          variant={toastItem.variant}
          onClick={() => dismiss(toastItem.id)}
          className="cursor-pointer"
        >
          {toastItem.message}
        </Toast>
      ))}
    </div>
  );
}

export default function EditAgentClientPage({
  agent: initialAgent,
  executions,
}: EditAgentClientPageProps) {
  return (
    <AgentProvider initialAgent={initialAgent}>
      <EditAgentContent executions={executions} />
    </AgentProvider>
  );
}
