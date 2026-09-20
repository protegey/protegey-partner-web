"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, X } from "lucide-react";

export type ToastTone = "warning" | "success";

/** A single, self-contained toast — mounts with a short entrance transition (no animation
 * library in this project), optionally auto-dismisses. Bottom-center on mobile, bottom-right
 * on larger screens, so it never sits over the sidebar. */
export function Toast({
  message,
  tone = "warning",
  onDismiss,
  autoHideMs,
}: {
  message: string;
  tone?: ToastTone;
  onDismiss: () => void;
  autoHideMs?: number;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!autoHideMs) return;
    const timer = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, onDismiss]);

  const Icon = tone === "success" ? Wifi : WifiOff;

  return (
    <div
      role="status"
      className={`fixed bottom-4 left-1/2 z-[110] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg transition-all duration-300 sm:left-auto sm:right-4 sm:w-auto sm:translate-x-0 ${
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <Icon className={`size-4 shrink-0 ${tone === "success" ? "text-primary" : "text-destructive"}`} />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
