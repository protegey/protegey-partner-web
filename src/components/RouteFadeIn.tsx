"use client";

import { usePathname } from "next/navigation";

/** Fades each page's content in on navigation — keyed by pathname so React remounts (and
 * replays the animation) on every route change, without needing every page to opt in itself. */
export function RouteFadeIn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in-up">
      {children}
    </div>
  );
}
