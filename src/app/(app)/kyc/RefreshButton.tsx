"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useLang();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
      {t("kycRefreshButton")}
    </button>
  );
}
