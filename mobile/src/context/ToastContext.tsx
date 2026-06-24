/**
 * Global toast context — wraps the app root and exposes useToast().
 * Usage:
 *   const { showToast, showSuccess, showError } = useToast();
 *   showSuccess("Moment saved");
 *   showError("Could not save moment");
 */
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Toast, type ToastState, type ToastTone } from "@/components/Toast";

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    idRef.current += 1;
    setToastState({ message, tone, id: idRef.current });
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const showError = useCallback((message: string) => showToast(message, "error"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      <Toast state={toastState} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
