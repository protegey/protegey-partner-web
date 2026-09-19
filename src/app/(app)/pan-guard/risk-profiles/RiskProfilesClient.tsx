"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import type { EntityRiskProfile } from "./actions";
import type { PaginatedResult } from "../../transactions/actions";

function scoreColor(score: number): string {
  if (score >= 60) return "text-destructive";
  if (score >= 30) return "text-amber-600";
  return "text-muted-foreground";
}

export function RiskProfilesClient({
  result,
  page,
  initialCustomer,
}: {
  result: PaginatedResult<EntityRiskProfile>;
  page: number;
  initialCustomer: string;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [customer, setCustomer] = useState(initialCustomer);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sourceLabel: Record<string, string> = {
    device: t("riskProfileSourceDevice"),
    behavioral: t("riskProfileSourceBehavioral"),
  };

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (customer) params.set("customer", customer);
    startTransition(() => router.push(`/pan-guard/risk-profiles?${params.toString()}`));
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("riskProfilesPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("riskProfilesPageSubtitle")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("signalsFilterCustomerLabel")}</label>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("signalsFilterCustomerPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          {t("txFilterApply")}
        </button>
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <ShieldAlert className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("riskProfilesEmpty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-8 px-4 py-2.5" />
                <th className="px-4 py-2.5 font-medium">{t("signalsColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColScore")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColContributions")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColLastUpdated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((profile) => {
                const expanded = expandedId === profile.id;
                return (
                  <Fragment key={profile.id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : profile.id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{profile.externalCustomerId}</td>
                      <td className={`px-4 py-2.5 font-semibold ${scoreColor(profile.cumulativeScore)}`}>{profile.cumulativeScore}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{profile.contributions.length}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(profile.updatedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-muted/30">
                        <td colSpan={5} className="px-4 py-3">
                          <ul className="flex flex-col gap-1.5">
                            {[...profile.contributions].reverse().map((c, i) => (
                              <li key={i} className="flex items-center justify-between gap-3 text-xs">
                                <span className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{sourceLabel[c.source] ?? c.source}</span>{" "}
                                  &mdash; {c.reason}
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                  <span className="text-muted-foreground">{new Date(c.at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</span>
                                  <span className="font-semibold text-foreground">+{c.points}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {result.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => applyFilters(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationPrevious")}
          </button>
          <span className="text-sm text-muted-foreground">
            {t("paginationPagePrefix")} {page} {t("paginationOf")} {result.totalPages}
          </span>
          <button
            type="button"
            onClick={() => applyFilters(page + 1)}
            disabled={page >= result.totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationNext")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
