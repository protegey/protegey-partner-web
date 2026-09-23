"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { RiskBreakdown } from "./RiskBreakdown";
import type { StringKey } from "@/lib/i18n/strings";
import type { EntityRiskProfile, RiskProfileCategory } from "./actions";
import type { PaginatedResult } from "../../transactions/actions";

function scoreColor(score: number): string {
  if (score >= 60) return "text-destructive";
  if (score >= 30) return "text-amber-600";
  return "text-muted-foreground";
}

const CATEGORY_LABEL_KEY: Record<RiskProfileCategory, StringKey> = {
  behavioral: "riskProfileCategoryBehavioral",
  device: "riskProfileCategoryDevice",
  network: "riskProfileCategoryNetwork",
  identity: "riskProfileCategoryIdentity",
  compliance: "riskProfileCategoryCompliance",
  other: "riskProfileCategoryOther",
};

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
    <div className="flex w-full flex-col gap-6">
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
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-8 px-4 py-2.5" />
                <th className="px-4 py-2.5 font-medium">{t("signalsColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium" title={t("riskProfileScoreWeightedHint")}>
                  {t("riskProfilesColWeighted")}
                </th>
                <th className="px-4 py-2.5 font-medium" title={t("riskProfileScoreDecayedHint")}>
                  {t("riskProfilesColDecayed")}
                </th>
                <th className="px-4 py-2.5 font-medium" title={t("riskProfileScoreCumulativeHint")}>
                  {t("riskProfilesColScore")}
                </th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColTopCategory")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColContributions")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColLastUpdated")}</th>
                <th className="px-4 py-2.5 font-medium" />
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
                      <td className={`px-4 py-2.5 text-base font-bold ${scoreColor(profile.weightedScore)}`}>{profile.weightedScore.toFixed(1)}</td>
                      <td className={`px-4 py-2.5 font-semibold ${scoreColor(profile.decayedScore)}`}>{profile.decayedScore.toFixed(1)}</td>
                      <td className={`px-4 py-2.5 text-xs ${scoreColor(profile.cumulativeScore)}`}>{profile.cumulativeScore}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {profile.topCategory ? t(CATEGORY_LABEL_KEY[profile.topCategory]) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{profile.contributions.length}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(profile.updatedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/pan-guard/risk-profiles/${encodeURIComponent(profile.externalCustomerId)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t("riskProfilesViewDetail")}
                        </Link>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-muted/30">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("riskProfilesBreakdownTitle")}
                              </p>
                              <RiskBreakdown breakdown={profile.breakdown} />
                            </div>
                            <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
                              {[...profile.contributions].reverse().slice(0, 8).map((c, i) => (
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
                          </div>
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

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={applyFilters} />
    </div>
  );
}
