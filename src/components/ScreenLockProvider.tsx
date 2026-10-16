"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lock } from "lucide-react";
import { lockScreenAction, unlockScreenAction } from "@/lib/auth-actions";
import { useLang } from "@/lib/i18n/LangProvider";

/** 5 minutes — long enough not to interrupt someone actually reading/thinking, short enough that
 * a screen left open while its owner stepped away doesn't stay exposed for long. Not
 * partner-configurable today; revisit only if a partner actually asks for a different value. */
const INACTIVITY_TIMEOUT_MS = 5 * 60_000;

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

interface ScreenLockContextValue {
  lock: () => void;
}

const ScreenLockContext = createContext<ScreenLockContextValue | null>(null);

/** The manual "Lock" button (header) and the inactivity timer both go through this — same
 * underlying lock, two different triggers. */
export function useScreenLock() {
  const ctx = useContext(ScreenLockContext);
  if (!ctx) throw new Error("useScreenLock must be used within ScreenLockProvider");
  return ctx;
}

export function ScreenLockProvider({ children, userEmail }: { children: React.ReactNode; userEmail: string | null }) {
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors `locked` for the activity listeners below to read synchronously without needing
  // `locked` in their effect's dependency array — re-attaching 5 window listeners on every
  // lock/unlock would be wasteful, and pointless: the whole point is to stop resetting the timer
  // the instant the screen locks, not to tear down and rebuild the listeners themselves.
  const lockedRef = useRef(false);
  const { t } = useLang();

  // Shows the overlay immediately and optimistically — the server call races in the background.
  // Even if it's still in flight (or fails outright), every other request already gets rejected
  // with 423 the moment it DOES land, so there's no real security gap from not waiting on it here.
  const lock = useCallback(() => {
    lockedRef.current = true;
    setLocked(true);
    void lockScreenAction();
  }, []);

  useEffect(() => {
    function resetTimer() {
      if (lockedRef.current) return; // already locked — nothing to auto-lock again until unlocked
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(lock, INACTIVITY_TIMEOUT_MS);
    }

    resetTimer();
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, resetTimer, { passive: true });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, resetTimer);
    };
  }, [lock]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await unlockScreenAction(password);
    setSubmitting(false);

    if (result.forcedLogout) {
      // Session cookies are already cleared server-side — a hard navigation, not router.push(),
      // so every bit of client-side app state resets along with it, not just the visible route.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    setPassword("");
    lockedRef.current = false;
    setLocked(false);
    // Activity resumes the inactivity clock from zero on unlock, same as any other activity event.
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(lock, INACTIVITY_TIMEOUT_MS);
  }

  return (
    <ScreenLockContext.Provider value={{ lock }}>
      {children}
      {locked
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
              <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <Lock className="size-6 text-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{t("lockScreenTitle")}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{t("lockScreenDescription")}</p>
                  {userEmail ? <p className="mt-1 text-sm font-medium text-foreground">{userEmail}</p> : null}
                </div>
                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
                  <input
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("lockScreenPasswordPlaceholder")}
                    className="rounded-md border border-border bg-card px-3 py-2 text-center text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? t("lockScreenUnlocking") : t("lockScreenUnlock")}
                  </button>
                </form>
                <p className="text-xs text-muted-foreground">{t("lockScreenAutoLockNotice")}</p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ScreenLockContext.Provider>
  );
}
