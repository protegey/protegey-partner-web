"use client";

import { useEffect, useRef, useState } from "react";

/** Eases toward the target fast then settles — reads as "the number is loading in", not a slot-machine spin. */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Animates from 0 up to `value` on mount — a small "alive" touch for the dashboard's headline
 * numbers. Skips straight to the final value when the viewer has `prefers-reduced-motion` set,
 * or when `value` isn't a plain integer (nothing to count through in that case).
 */
function useCountUp(value: number, durationMs = 650): number {
  // Always starts at `value` — identical on the server and on the client's hydration pass, so
  // there's nothing for React to flag as a mismatch. The animation itself only ever runs from
  // inside the effect below, which fires after hydration completes; resetting to 0 there and
  // counting back up is a perfectly normal post-hydration re-render, not a hydration mismatch.
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!Number.isFinite(value) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    setDisplay(0);
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(value * easeOutQuad(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return display;
}

export function KpiCard({
  icon,
  label,
  value,
  locale,
  delayMs = 0,
}: {
  /** A rendered icon element (e.g. `<Activity className="size-4 text-primary" />`), not the
   * component itself — this is a Client Component, and a raw component reference (a function)
   * can't cross the Server/Client boundary as a prop, only an already-rendered element can. */
  icon: React.ReactNode;
  label: string;
  value: number;
  locale: string;
  delayMs?: number;
}) {
  const display = useCountUp(value);
  return (
    <div className="animate-fade-in-up rounded-md border border-border bg-card p-4" style={{ animationDelay: `${delayMs}ms` }}>
      {icon}
      <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{display.toLocaleString(locale)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
