"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { reauthenticateAction } from "@/lib/auth-actions";
import type { AuthExpired } from "@/lib/api";
import { Dialog } from "./Dialog";

function isAuthExpired(value: unknown): value is AuthExpired {
  return Boolean(value) && typeof value === "object" && "authExpired" in (value as object);
}

interface SessionExpiredContextValue {
  /**
   * Runs `action`; if it comes back tagged { authExpired: true } (see apiFetchGuarded in
   * lib/api.ts), opens the in-place login dialog and waits. On successful re-login, runs
   * `action` again and returns *that* result — the caller sees a normal result as if the
   * session had never expired. Returns null only if the user cancels, or the retry itself
   * also fails (caller's existing error handling takes it from there).
   */
  guard: <T,>(action: () => Promise<T | AuthExpired>) => Promise<T | null>;
}

const SessionExpiredContext = createContext<SessionExpiredContextValue | null>(null);

export function useSessionGuard() {
  const ctx = useContext(SessionExpiredContext);
  if (!ctx) throw new Error("useSessionGuard must be used within SessionExpiredProvider");
  return ctx.guard;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function SessionExpiredProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Holds the resolver for the promise `guard` is awaiting while the dialog is open —
  // resolved(true) on successful re-login, resolved(false) on cancel.
  const resolverRef = useRef<((success: boolean) => void) | null>(null);

  const guard = useCallback(async <T,>(action: () => Promise<T | AuthExpired>): Promise<T | null> => {
    const result = await action();
    if (!isAuthExpired(result)) return result;

    setError(null);
    setOpen(true);
    const success = await new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
    setOpen(false);
    if (!success) return null;

    const retryResult = await action();
    return isAuthExpired(retryResult) ? null : retryResult;
  }, []);

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setError(null);
    const result = await reauthenticateAction(email, password);
    if (result.error) {
      setError(result.error);
      return;
    }
    resolverRef.current?.(true);
  }

  function handleCancel() {
    resolverRef.current?.(false);
  }

  return (
    <SessionExpiredContext.Provider value={{ guard }}>
      {children}
      <Dialog
        open={open}
        onClose={handleCancel}
        title="Your session has expired"
        description="Sign back in to continue where you left off — nothing you were doing has been lost."
      >
        <form action={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            placeholder="Email"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </Dialog>
    </SessionExpiredContext.Provider>
  );
}
