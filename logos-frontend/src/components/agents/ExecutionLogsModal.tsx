"use client";

import { useState, useEffect } from "react";
import { AgentExecutionLog, AgentExecution } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  Clock,
  AlertCircle,
  Info,
  Settings,
  Zap,
  MessageSquare,
  FileText,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getExecutionAction } from "@/app/actions/execution";

interface ExecutionLogsModalProps {
  executionId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getLogIcon = (logType: AgentExecutionLog["log_type"]) => {
  switch (logType) {
    case "info":
      return <Info className="h-4 w-4 text-primary" />;
    case "tool_call":
      return <Settings className="h-4 w-4 text-green-500" />;
    case "llm_input":
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case "llm_output":
      return <Zap className="h-4 w-4 text-yellow-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function ExecutionLogsModal({
  executionId,
  isOpen,
  onClose,
}: ExecutionLogsModalProps) {
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("logs");

  useEffect(() => {
    const fetchExecutionData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch logs and execution data in parallel
        const [logsResponse, execResult] = await Promise.all([
          fetch(`/api/execution-logs/${executionId}`),
          getExecutionAction(executionId),
        ]);

        if (!logsResponse.ok) {
          throw new Error("Failed to fetch logs");
        }

        const logsData = await logsResponse.json();
        setLogs(logsData.logs || []);

        // Set execution data from server action
        if (execResult.success && execResult.execution) {
          setExecution(execResult.execution);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch execution data",
        );
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && executionId) {
      fetchExecutionData();
    }
  }, [isOpen, executionId]);

  const renderFinalOutput = () => {
    // If execution data is available, show the final result or error
    if (execution) {
      if (execution.state === "failed" && execution.error) {
        return (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">
                Execution Failed
              </span>
            </div>
            <pre className="whitespace-pre-wrap break-words text-sm text-destructive">
              {execution.error}
            </pre>
          </div>
        );
      }

      if (execution.result) {
        return (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">Final Result</span>
            </div>
            <pre className="whitespace-pre-wrap break-words text-sm text-foreground">
              {JSON.stringify(execution.result, null, 2)}
            </pre>
          </div>
        );
      }

      if (execution.state === "running") {
        return (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Execution is still running...
            </div>
          </div>
        );
      }
    }

    // Fallback: try to extract final output from logs
    const finalLogs = logs
      .filter(
        (log) =>
          log.log_type === "llm_output" ||
          log.log_type === "error" ||
          (log.log_type === "info" &&
            log.content &&
            typeof log.content === "object" &&
            "final_result" in log.content),
      )
      .slice(-3); // Get last few relevant logs

    if (finalLogs.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            No final output available for this execution
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-foreground mb-3">
          Final execution steps:
        </div>
        {finalLogs.map((log) => (
          <div
            key={log.id}
            className={`p-4 rounded-lg border ${
              log.log_type === "error"
                ? "bg-destructive/10 border-destructive/20"
                : "bg-muted border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              {getLogIcon(log.log_type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium capitalize">
                    {log.log_type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="text-sm">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(log.content, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl border border-border shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            Execution Details - {executionId.substring(0, 8)}...
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading execution data...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">Error: {error}</div>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList className="mx-4 mt-4 w-fit">
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Execution Logs
                </TabsTrigger>
                <TabsTrigger value="output" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Final Output
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="logs"
                className="flex-1 overflow-auto p-4 m-0"
              >
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                      No logs found for this execution
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-muted p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-3">
                          {getLogIcon(log.log_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-foreground capitalize">
                                {log.log_type.replace("_", " ")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.timestamp), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(log.content, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="output"
                className="flex-1 overflow-auto p-4 m-0"
              >
                {renderFinalOutput()}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
