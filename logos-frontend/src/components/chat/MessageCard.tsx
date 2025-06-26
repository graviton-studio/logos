"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  FileText,
  ArrowRight,
  LightbulbIcon,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FaFont } from "react-icons/fa";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import { IntegrationRequestCard } from "./IntegrationRequestCard";
import { snakeToTitleCase } from "@/utils/string";
import { cn } from "@/lib/utils";
import { type UIMessage } from "@ai-sdk/ui-utils";
import useUser from "@/lib/hooks";

type ToolCallResult = {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
};

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: ToolCallResult;
}

interface TruncatedContentProps {
  content: string;
  maxLength?: number;
  children: (content: string) => React.ReactNode;
}

function TruncatedContent({
  content,
  maxLength = 1000,
  children,
}: TruncatedContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (content.length <= maxLength) {
    return <>{children(content)}</>;
  }

  const truncatedContent = content.substring(0, maxLength);
  const displayContent = isExpanded ? content : truncatedContent;

  return (
    <div className="space-y-2">
      {children(displayContent)}
      {!isExpanded && (
        <div className="text-xs text-muted-foreground">
          ... ({content.length - maxLength} more characters)
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Show more
          </>
        )}
      </Button>
    </div>
  );
}

function JsonValue({ value }: { value: unknown }) {
  if (typeof value === "object" && value !== null) {
    return (
      <div className="pl-4 border-l border-border break-words">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="flex gap-2 break-words">
            <span className="text-muted-foreground">{k}:</span>
            <JsonValue value={v} />
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-foreground break-words">{String(value)}</span>;
}

interface ToolCallProps {
  toolInvocation: ToolInvocation;
}

function ToolCall({ toolInvocation }: ToolCallProps) {
  // Special handling for request_access tool
  if (toolInvocation.toolName === "request_access") {
    const provider = toolInvocation.args.provider as string;
    const description = toolInvocation.args.description as string;

    return (
      <div className="space-y-3 max-w-md">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Terminal className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            Integration Access Request
          </span>
          <Badge
            variant="outline"
            className="border-orange-500/50 text-orange-600 dark:text-orange-400"
          >
            Action Required
          </Badge>
        </div>
        <IntegrationRequestCard provider={provider} description={description} />
      </div>
    );
  }

  // Default tool call display
  return (
    <div className="rounded-lg p-4 bg-muted/30 border space-y-3 break-words max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
          <Terminal className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-mono">
            {snakeToTitleCase(toolInvocation.toolName)}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "whitespace-nowrap",
            toolInvocation.result?.isError
              ? "border-destructive/50 text-destructive"
              : "border-green-500/50 text-green-600 dark:text-green-400",
          )}
        >
          {toolInvocation.result?.isError ? (
            <XCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
          )}
          {toolInvocation.state}
        </Badge>
      </div>

      {Object.keys(toolInvocation.args).length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Arguments</div>
          <div className="text-sm font-mono bg-muted/50 rounded-md p-2 break-words">
            <JsonValue value={toolInvocation.args} />
          </div>
        </div>
      )}

      {toolInvocation.result && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowRight className="h-3 w-3 flex-shrink-0" />
            Result
          </div>
          <div className="text-sm font-mono bg-muted/50 rounded-md p-2 break-words">
            {toolInvocation.result.content.map(
              (item: { type: string; text: string }, i: number) => (
                <TruncatedContent
                  key={`${toolInvocation.toolCallId}-result-${i}-${item.type}`}
                  content={item.text}
                  maxLength={1000}
                >
                  {(content) => (
                    <div className="text-foreground whitespace-pre-wrap">
                      {content}
                    </div>
                  )}
                </TruncatedContent>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageCardProps {
  message: UIMessage;
  isUser: boolean;
}

export function MessageCard({ message, isUser }: MessageCardProps) {
  const { user } = useUser();
  return (
    <div
      className={cn("flex items-start gap-4", isUser ? "flex-row-reverse" : "")}
    >
      <div
        className={cn(
          "size-8 rounded-lg flex-shrink-0 flex items-center justify-center",
          isUser ? "bg-primary" : "bg-muted",
        )}
      >
        {isUser ? (
          <p className="text-white font-semibold">
            {user?.user_metadata.full_name
              ? user.user_metadata.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
              : ""}
          </p>
        ) : (
          <FaFont className="h-4 w-4 text-black" />
        )}
      </div>

      <div
        className={cn(
          "space-y-3 min-w-0 flex-1",
          isUser ? "items-end flex flex-col" : "items-start", // Ensure user message content aligns right
        )}
      >
        {message.parts ? (
          message.parts.map((part, i) => {
            const key = `${message.id}-${i}`;

            switch (part.type) {
              case "text":
              case "reasoning":
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg p-4 break-words max-w-2xl", // Updated for vertical wrapping
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : part.type === "reasoning"
                          ? "bg-muted/50 border"
                          : "bg-muted",
                    )}
                  >
                    {part.type === "reasoning" && (
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground whitespace-nowrap">
                        <LightbulbIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Reasoning</span>
                      </div>
                    )}
                    <TruncatedContent
                      content={
                        part.type === "reasoning" ? part.reasoning : part.text
                      }
                      maxLength={2000}
                    >
                      {(content) => (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          <MemoizedMarkdown content={content} id={key} />
                        </div>
                      )}
                    </TruncatedContent>
                  </div>
                );
              case "tool-invocation":
                return (
                  <ToolCall key={key} toolInvocation={part.toolInvocation} />
                );
              case "source":
                return (
                  <div
                    key={key}
                    className="rounded-lg p-4 bg-muted/30 border break-words max-w-2xl"
                  >
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground whitespace-nowrap">
                      <BookOpen className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        Source: {JSON.stringify(part.source)}
                      </span>
                    </div>
                    <TruncatedContent
                      content={part.source.url}
                      maxLength={1000}
                    >
                      {(content) => (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          <MemoizedMarkdown content={content} id={key} />
                        </div>
                      )}
                    </TruncatedContent>
                  </div>
                );
              case "file":
                return (
                  <div
                    key={key}
                    className="rounded-lg p-4 bg-muted/30 border break-words max-w-2xl"
                  >
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground whitespace-nowrap">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-mono">{part.mimeType}</span>
                    </div>
                    <TruncatedContent content={part.data} maxLength={1500}>
                      {(content) => (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          <MemoizedMarkdown content={content} id={key} />
                        </div>
                      )}
                    </TruncatedContent>
                  </div>
                );
              default:
                return null;
            }
          })
        ) : message.content ? (
          <div
            className={cn(
              "rounded-lg p-4 break-words max-w-2xl", // Updated for vertical wrapping
              isUser ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            <TruncatedContent content={message.content} maxLength={2000}>
              {(content) => (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MemoizedMarkdown
                    content={content}
                    id={message.id || `message-content-${message.id}`}
                  />
                </div>
              )}
            </TruncatedContent>
          </div>
        ) : null}
      </div>
    </div>
  );
}
