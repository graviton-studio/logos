"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 right-4 z-50 w-full max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out",
          {
            "bg-background border border-border text-foreground":
              variant === "default",
            "bg-destructive text-destructive-foreground":
              variant === "destructive",
            "bg-green-600 text-white": variant === "success",
          },
          className,
        )}
        {...props}
      />
    );
  },
);
Toast.displayName = "Toast";

export { Toast };
