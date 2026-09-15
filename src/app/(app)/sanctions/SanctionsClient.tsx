"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
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
          <h1 className="text-xl font-semibold text-foreground">Sanctions list</h1>
          <p className="text-sm text-muted-foreground">
            Read-only view of the sanctions database Protegey screens against for KYB and KYC.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startTransition(() => router.refresh())}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <StatsCards stats={stats} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Name…"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="person">Person</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="nigsac">NIGSAC</option>
            <option value="ofac">OFAC</option>
            <option value="eu">EU</option>
            <option value="un">UN</option>
            <option value="au">AU</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pb-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeDelisted}
            onChange={(e) => setIncludeDelisted(e.target.checked)}
            className="rounded border-border"
          />
          Include delisted
        </label>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply
        </button>
      </div>

      <SanctionsTable sanctions={sanctions} total={total} />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => applyFilters(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => applyFilters(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
