import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export async function PaginationControls({ page, totalPages, total, href }: { page: number; totalPages: number; total: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const lang = await getLang();
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>{t(lang, "paginationPagePrefix")} {page} {t(lang, "paginationOf")} {totalPages} — {total} {t(lang, "paginationTotalSuffix")}</p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted">
            <ChevronLeft className="size-4" />{t(lang, "paginationPrevious")}
          </Link>
        ) : <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 py-1.5 opacity-40"><ChevronLeft className="size-4" />{t(lang, "paginationPrevious")}</span>}
        {page < totalPages ? (
          <Link href={href(page + 1)} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted">
            {t(lang, "paginationNext")}<ChevronRight className="size-4" />
          </Link>
        ) : <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 py-1.5 opacity-40">{t(lang, "paginationNext")}<ChevronRight className="size-4" /></span>}
      </div>
    </div>
  );
}
