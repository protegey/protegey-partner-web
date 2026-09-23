"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";

/**
 * Reusable pagination bar for client components that drive navigation themselves
 * (e.g. via `router.push` inside a `useTransition`, alongside other filters that
 * live in the same URL). For server components that only need page navigation,
 * prefer `@/components/PaginationControls` (renders plain `<Link>`s server-side).
 */
export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useLang();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>
        {t("paginationPagePrefix")} {page} {t("paginationOf")} {totalPages}
        {total !== undefined ? ` — ${total.toLocaleString()} ${t("paginationTotalSuffix")}` : ""}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          {t("paginationPrevious")}
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("paginationNext")}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
