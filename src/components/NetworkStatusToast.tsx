"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Toast, type ToastTone } from "./Toast";
import { useLang } from "@/lib/i18n/LangProvider";
import { SLOW_NAVIGATION_EVENT } from "./PageTransitionOverlay";

interface NetworkConnectionLike {
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

const SLOW_EFFECTIVE_TYPES = new Set(["slow-2g", "2g"]);
/** Avoids a flood of toasts if the connection is borderline (flapping between types) or the
 * user clicks several links in a row while the connection is genuinely slow. */
const REPEAT_COOLDOWN_MS = 15000;

/**
 * Watches connectivity from a few angles and surfaces a single, calm toast — never more than
 * one at a time, never spammy. Covers: hard offline/online (universal, `navigator.onLine`),
 * a sustained slow connection type where the browser exposes it (Network Information API —
 * Chromium only, silently skipped elsewhere), and a navigation that's taking unusually long
 * (dispatched by PageTransitionOverlay) — the last one turns "the app looks frozen" into an
 * actual explanation.
 */
export function NetworkStatusToast() {
  const { t } = useLang();
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const lastWarnedAtRef = useRef(0);

  const showWarning = useCallback((message: string) => {
    const now = Date.now();
    if (now - lastWarnedAtRef.current < REPEAT_COOLDOWN_MS) return;
    lastWarnedAtRef.current = now;
    setToast({ message, tone: "warning" });
  }, []);

  const showSuccess = useCallback((message: string) => setToast({ message, tone: "success" }), []);

  useEffect(() => {
    function handleOffline() {
      showWarning(t("networkOffline"));
    }
    function handleOnline() {
      showSuccess(t("networkRestored"));
    }
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [showWarning, showSuccess, t]);

  useEffect(() => {
    const connection = (navigator as unknown as { connection?: NetworkConnectionLike }).connection;
    if (!connection?.addEventListener) return; // Network Information API not supported (Safari/Firefox) — offline/online still covers the hard case.

    let debounce: ReturnType<typeof setTimeout> | null = null;
    function handleChange() {
      if (debounce) clearTimeout(debounce);
      // Debounce: connection type can flap for a moment during the change itself.
      debounce = setTimeout(() => {
        if (connection?.effectiveType && SLOW_EFFECTIVE_TYPES.has(connection.effectiveType)) {
          showWarning(t("networkSlow"));
        }
      }, 3000);
    }
    connection.addEventListener("change", handleChange);
    return () => {
      connection.removeEventListener?.("change", handleChange);
      if (debounce) clearTimeout(debounce);
    };
  }, [showWarning, t]);

  useEffect(() => {
    function handleSlowNavigation() {
      if (!navigator.onLine) return; // the offline toast already covers this — don't double up
      showWarning(t("networkSlow"));
    }
    window.addEventListener(SLOW_NAVIGATION_EVENT, handleSlowNavigation);
    return () => window.removeEventListener(SLOW_NAVIGATION_EVENT, handleSlowNavigation);
  }, [showWarning, t]);

  if (!toast) return null;

  return (
    <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} autoHideMs={toast.tone === "success" ? 4000 : 6000} />
  );
}
