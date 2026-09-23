"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import type { Lang, StringKey } from "@/lib/i18n/strings";
import type { RiskProfileCategory, RiskProfileHistoryEntry } from "../actions";

const CATEGORY_LABEL_KEY: Record<RiskProfileCategory, StringKey> = {
  behavioral: "riskProfileCategoryBehavioral",
  network: "riskProfileCategoryNetwork",
  contextual: "riskProfileCategoryContextual",
  historical: "riskProfileCategoryHistorical",
};

const DIRECTION_CONFIG: Record<RiskProfileHistoryEntry["direction"], { icon: typeof ArrowUp; color: string }> = {
  increased: { icon: ArrowUp, color: "text-destructive" },
  decreased: { icon: ArrowDown, color: "text-emerald-600" },
  unchanged: { icon: Minus, color: "text-muted-foreground" },
};

/** "2 hours ago" / "il y a 2 heures" — no library needed for the handful of buckets this UI cares about. */
function formatRelativeTime(iso: string, lang: Lang): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { numeric: "auto" });

  const buckets: [number, number, Intl.RelativeTimeFormatUnit][] = [
    [60, 1, "second"],
    [3600, 60, "minute"],
    [86400, 3600, "hour"],
    [2592000, 86400, "day"],
    [31536000, 2592000, "month"],
    [Infinity, 31536000, "year"],
  ];

  for (const [limit, divisor, unit] of buckets) {
    if (Math.abs(diffSeconds) < limit) {
      return rtf.format(Math.round(diffSeconds / divisor), unit);
    }
  }
  return rtf.format(0, "second");
}

/** Motivated risk-score history — "why is the score what it is" as a timeline of before/after
 * changes, not just a flat log of point deltas. Newest first, as the API already sorts it. */
export function RiskHistoryTimeline({ history }: { history: RiskProfileHistoryEntry[] }) {
  const { t, lang } = useLang();

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("riskProfileHistoryEmpty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((entry, i) => {
        const { icon: DirectionIcon, color } = DIRECTION_CONFIG[entry.direction];
        return (
          <li key={i} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0 last:pb-0">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={`flex shrink-0 items-center gap-1 font-mono text-sm font-semibold ${color}`}>
                {entry.scoreBefore} → {entry.scoreAfter}
                <DirectionIcon className="size-3.5" />
              </span>
              <span className="min-w-0 truncate text-muted-foreground">
                <span className="font-medium text-foreground">{t(CATEGORY_LABEL_KEY[entry.category] ?? "riskProfileCategoryHistorical")}</span>{" "}
                &mdash; {entry.reason}
              </span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground" title={new Date(entry.at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}>
              {formatRelativeTime(entry.at, lang)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
