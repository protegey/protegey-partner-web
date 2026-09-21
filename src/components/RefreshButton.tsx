"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLang } from "@/lib/i18n/LangProvider";

export function RefreshButton() {
  const router = useRouter();
  const { t } = useLang();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      aria-label={t("refreshButton")}
      title={t("refreshButton")}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
      {t("refreshButton")}
    </button>
  );
}
