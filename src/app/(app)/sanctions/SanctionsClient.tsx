"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Search } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { StatsCards } from "./StatsCards";
import { SanctionsTable } from "./SanctionsTable";
import type { SanctionsEntity, SanctionsStats } from "./actions";

export function SanctionsClient({
  sanctions,
  page,
  totalPages,
  total,
  stats,
  initialType,
  initialSource,
  initialSearch,
  initialIncludeDelisted,
}: {
  sanctions: SanctionsEntity[];
  page: number;
  totalPages: number;
  total: number;
  stats: SanctionsStats;
  initialType: string;
  initialSource: string;
  initialSearch: string;
  initialIncludeDelisted: boolean;
}) {
  const router = useRouter();
  const { t } = useLang();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState(initialType);
  const [source, setSource] = useState(initialSource);
  const [includeDelisted, setIncludeDelisted] = useState(initialIncludeDelisted);

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (search) params.set("search", search);
    if (type !== "all") params.set("type", type);
    if (source !== "all") params.set("source", source);
    if (includeDelisted) params.set("delisted", "true");
    startTransition(() => {
      router.push(`/sanctions?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("sanctionsPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("sanctionsPageSubtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/sanctions/search"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Search className="size-4" />
            {t("sanctionsSearchToolLink")}
          </Link>
          <button
            type="button"
            onClick={() => startTransition(() => router.refresh())}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
            {t("kycRefreshButton")}
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsSearchLabel")}</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("sanctionsSearchPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsColType")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("sanctionsTypeAll")}</option>
            <option value="person">{t("sanctionsTypePerson")}</option>
            <option value="business">{t("sanctionsTypeBusiness")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsColSource")}</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("sanctionsTypeAll")}</option>
            <option value="nigsac">NIGSAC</option>
            <option value="ofac">OFAC</option>
            <option value="eu">EU</option>
            <option value="un">UN</option>
            <option value="au">AU</option>
            <option value="custom">{t("sanctionsSourceCustom")}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pb-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeDelisted}
            onChange={(e) => setIncludeDelisted(e.target.checked)}
            className="rounded border-border"
          />
          {t("sanctionsIncludeDelisted")}
        </label>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("sanctionsApplyButton")}
        </button>
      </div>

      <SanctionsTable sanctions={sanctions} total={total} />

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={applyFilters} />
    </div>
  );
}
