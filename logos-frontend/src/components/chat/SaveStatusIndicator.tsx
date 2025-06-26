"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  onRetry?: () => void;
  onClearError?: () => void;
  className?: string;
}

export function SaveStatusIndicator({
  isSaving,
  lastSaved,
  error,
  onRetry,
  onClearError,
  className = "",
}: SaveStatusIndicatorProps) {
  // Don't show anything if no save activity has occurred
  if (!isSaving && !lastSaved && !error) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span className="text-destructive">Save failed</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs text-destructive hover:text-destructive"
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
          {onClearError && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
              onClick={onClearError}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </>
      ) : lastSaved ? (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">
            Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
          </span>
        </>
      ) : null}
    </div>
  );
}
