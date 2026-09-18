"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";

/**
 * Backstop for the rare case where middleware's silent token refresh (src/middleware.ts)
 * also failed — i.e. the refresh token itself is dead, a genuine logout. Next.js strips a
 * thrown Server Component error down to a generic digest-only Error in production, so this
 * can't reliably tell *why* it failed and doesn't try to; it just offers a clear way back in,
 * to the exact page that failed.
 */
export default function AppError() {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold text-foreground">{t("appErrorTitle")}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("appErrorSubtitle")}</p>
      </div>
      <Link
        href={`/login?returnTo=${encodeURIComponent(pathname)}`}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t("appErrorLoginAgain")}
      </Link>
    </div>
  );
}
