"use client";

import { useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  message: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    ({
      message,
      variant = "default",
      duration = 3000,
    }: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastMessage = { id, message, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);

      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toast, toasts, dismiss };
}
