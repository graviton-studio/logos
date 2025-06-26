"use client";

import React, { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Paperclip, X } from "lucide-react";

interface ChatInputBarProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

interface AttachedFile {
  file: File;
  content: string;
  type: string;
}

interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content: string;
}

export function ChatInputBar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const SUPPORTED_FILE_TYPES = [
    ".pdf",
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".yaml",
    ".yml",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessingFiles(true);

    try {
      // Validate files before uploading
      const validFiles: File[] = [];
      for (const file of Array.from(files)) {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }

        // Validate file type
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
          alert(
            `File type "${fileExtension}" is not supported. Supported types: ${SUPPORTED_FILE_TYPES.join(", ")}`,
          );
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        return;
      }

      // Upload files to the API for processing
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process files");
      }

      const result = await response.json();

      if (result.success && result.files) {
        const newAttachedFiles: AttachedFile[] = result.files.map(
          (processedFile: ProcessedFile) => ({
            file: validFiles.find((f) => f.name === processedFile.name)!,
            content: processedFile.content,
            type: processedFile.type,
          }),
        );

        setAttachedFiles((prev) => [...prev, ...newAttachedFiles]);
      } else {
        throw new Error("Invalid response from file upload API");
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert(
        `Failed to process files: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitMessage = () => {
    console.log("=== ChatInputBar submitMessage Debug ===");
    console.log("Attached files:", attachedFiles);
    console.log("Input text:", input);

    if (attachedFiles.length > 0) {
      // Create a custom event with file attachments
      const customEvent = {
        preventDefault: () => {},
        attachedFiles,
      } as React.FormEvent<HTMLFormElement> & { attachedFiles: AttachedFile[] };

      console.log("Submitting with attachments:", customEvent);
      handleSubmit(customEvent);
    } else {
      // Create a standard form event
      const standardEvent = {
        preventDefault: () => {},
      } as React.FormEvent<HTMLFormElement>;

      console.log("Submitting without attachments");
      handleSubmit(standardEvent);
    }

    // Clear attachments after submit
    setAttachedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const enhancedHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  return (
    <div className="sticky bottom-0 z-10 p-6 bg-background/75 backdrop-blur-sm border-b rounded-b-xl">
      {/* File attachments preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((attachedFile, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
            >
              <Paperclip className="h-4 w-4" />
              <span className="max-w-[200px] truncate">
                {attachedFile.file.name}
              </span>
              <span className="text-muted-foreground">
                ({(attachedFile.file.size / 1024).toFixed(1)}KB)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-destructive/20"
                onClick={() => removeAttachedFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={enhancedHandleSubmit} className="flex items-end gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_FILE_TYPES.join(",")}
          onChange={handleFileUpload}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isProcessingFiles}
          title="Attach files (PDF, TXT, MD, CSV)"
        >
          {isProcessingFiles ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>

        <Textarea
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[40px] max-h-[200px] resize-y rounded-lg"
          disabled={isLoading}
          rows={1}
        />

        <Button
          type="submit"
          disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
