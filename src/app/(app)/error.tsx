"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

/**
 * Backstop for the rare case where middleware's silent token refresh (src/middleware.ts)
 * also failed — i.e. the refresh token itself is dead, a genuine logout. Next.js strips a
 * thrown Server Component error down to a generic digest-only Error in production, so this
 * can't reliably tell *why* it failed and doesn't try to; it just offers a clear way back in,
 * to the exact page that failed.
 */
export default function AppError() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold text-foreground">Something went wrong</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This is often because your session has expired. Sign in again to pick up where you left off.
        </p>
      </div>
      <Link
        href={`/login?returnTo=${encodeURIComponent(pathname)}`}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Log in again
      </Link>
    </div>
  );
}
