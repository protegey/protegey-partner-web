"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Below this, a navigation is treated as instant and the overlay never shows — avoids a flash
 * on fast client-cached transitions. */
const SHOW_DELAY_MS = 150;
/** Minimum time the overlay stays up once shown, so it never flickers in and immediately out. */
const MIN_VISIBLE_MS = 250;
/** If a navigation is still pending past this, something is likely slow (not just "loading") —
 * NetworkStatusToast listens for this event to explain why, instead of leaving a bare spinner. */
const SLOW_NAVIGATION_MS = 4000;
/** Absolute upper bound — never leave the overlay stuck forever if something goes wrong. */
const SAFETY_TIMEOUT_MS = 15000;

export const SLOW_NAVIGATION_EVENT = "protegey:slow-navigation";

/**
 * Shows a calm, blurred full-screen overlay while an internal navigation is in flight — the app
 * is entirely Server Components/Server Actions, so a click can go quiet for a moment with no
 * other feedback otherwise, which reads as "the app is broken". Triggered by intercepting clicks
 * on internal links (covers the vast majority of navigation — sidebar, in-page links) and cleared
 * once the route actually changes.
 */
export function PageTransitionOverlay() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const currentPathRef = useRef(pathname);
  const shownAtRef = useRef(0);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearAllTimers() {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (slowTimer.current) clearTimeout(slowTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
  }

  function hide() {
    clearAllTimers();
    setEntered(false);
    setTimeout(() => setMounted(false), 200);
  }

  // Route actually changed — the navigation this overlay was tracking is done. Cancel any
  // pending "show"/"slow" timers unconditionally first: a fast navigation can resolve before
  // SHOW_DELAY_MS elapses, and without this the overlay would pop up moments AFTER the page
  // already changed and then sit stuck (nothing left to clear it a second time).
  useEffect(() => {
    currentPathRef.current = pathname;
    clearAllTimers();
    if (!mounted) return;
    const elapsed = Date.now() - shownAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = setTimeout(hide, wait);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === currentPathRef.current) return;

      clearAllTimers();
      showTimer.current = setTimeout(() => {
        shownAtRef.current = Date.now();
        setMounted(true);
        requestAnimationFrame(() => setEntered(true));
      }, SHOW_DELAY_MS);

      slowTimer.current = setTimeout(() => {
        window.dispatchEvent(new CustomEvent(SLOW_NAVIGATION_EVENT));
      }, SLOW_NAVIGATION_MS);

      safetyTimer.current = setTimeout(hide, SAFETY_TIMEOUT_MS);
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/50 backdrop-blur-sm transition-opacity duration-200 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-3 rounded-lg bg-card/90 px-6 py-5 shadow-lg">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    </div>
  );
}
