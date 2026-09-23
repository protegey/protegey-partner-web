"use client";

import { useLang } from "@/lib/i18n/LangProvider";
import type { StringKey } from "@/lib/i18n/strings";
import type { RiskProfileBreakdownEntry, RiskProfileCategory } from "./actions";

const CATEGORY_LABEL_KEY: Record<RiskProfileCategory, StringKey> = {
  behavioral: "riskProfileCategoryBehavioral",
  device: "riskProfileCategoryDevice",
  network: "riskProfileCategoryNetwork",
  identity: "riskProfileCategoryIdentity",
  compliance: "riskProfileCategoryCompliance",
  other: "riskProfileCategoryOther",
};

const CATEGORY_BAR_COLOR: Record<RiskProfileCategory, string> = {
  behavioral: "bg-destructive",
  device: "bg-amber-500",
  network: "bg-sky-500",
  identity: "bg-purple-500",
  compliance: "bg-emerald-500",
  other: "bg-muted-foreground",
};

/** One row per risk dimension — a small horizontal bar chart, richest category first (as the API already sorts it). */
export function RiskBreakdown({ breakdown }: { breakdown: RiskProfileBreakdownEntry[] }) {
  const { t } = useLang();
  if (breakdown.length === 0) return null;
  const maxPoints = Math.max(...breakdown.map((b) => b.points), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {breakdown.map((entry) => (
        <div key={entry.category} className="flex items-center gap-3 text-xs">
          <span className="w-24 shrink-0 font-medium text-foreground">{t(CATEGORY_LABEL_KEY[entry.category])}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${CATEGORY_BAR_COLOR[entry.category]}`}
              style={{ width: `${Math.max((entry.points / maxPoints) * 100, entry.points > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-semibold text-foreground">
            {entry.points} {t("riskProfilesBreakdownPoints")}
          </span>
          <span className="w-20 shrink-0 text-right text-muted-foreground">
            {entry.count} {t("riskProfilesBreakdownCount")}
          </span>
          <span className="w-24 shrink-0 text-right text-muted-foreground">
            {Math.round(entry.weight * 100)}% {t("riskProfilesBreakdownWeight")}
          </span>
        </div>
      ))}
    </div>
  );
}
