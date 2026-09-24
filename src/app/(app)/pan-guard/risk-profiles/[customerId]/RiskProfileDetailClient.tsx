"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { RiskBreakdown } from "../RiskBreakdown";
import { RiskHistoryTimeline } from "./RiskHistoryTimeline";
import { ScreeningMatchesSection } from "./ScreeningMatchesSection";
import type { StringKey } from "@/lib/i18n/strings";
import type { EntityRiskProfile, RiskProfileCategory } from "../actions";
import type { ScreeningMatch } from "../../../sanctions/actions";

type RiskLevel = EntityRiskProfile["riskLevel"];

const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-600",
  high: "bg-orange-500/15 text-orange-600",
  critical: "bg-destructive/15 text-destructive",
};

const RISK_LEVEL_LABEL_KEY: Record<RiskLevel, StringKey> = {
  low: "riskLevelLow",
  medium: "riskLevelMedium",
  high: "riskLevelHigh",
  critical: "riskLevelCritical",
};

const CATEGORY_LABEL_KEY: Record<RiskProfileCategory, StringKey> = {
  behavioral: "riskProfileCategoryBehavioral",
  network: "riskProfileCategoryNetwork",
  contextual: "riskProfileCategoryContextual",
  historical: "riskProfileCategoryHistorical",
};

function ScoreCard({
  label,
  value,
  hint,
  emphasize,
  riskLevel,
  t,
}: {
  label: string;
  value: number;
  hint: string;
  emphasize?: boolean;
  riskLevel?: RiskLevel;
  t: (key: StringKey) => string;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-md border p-4 ${emphasize ? "border-primary bg-primary/5" : "border-border bg-card"}`} title={hint}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-foreground">{value.toFixed(1)}</span>
        {riskLevel ? (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_LEVEL_STYLES[riskLevel]}`}>
            {t(RISK_LEVEL_LABEL_KEY[riskLevel])}
          </span>
        ) : null}
      </div>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

export function RiskProfileDetailClient({
  profile,
  externalCustomerId,
  screeningMatches,
}: {
  profile: EntityRiskProfile | null;
  externalCustomerId?: string;
  screeningMatches: ScreeningMatch[];
}) {
  const { t, lang } = useLang();

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link href="/pan-guard/risk-profiles" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t("riskProfileDetailBackToList")}
        </Link>
        <h1 className="text-xl font-semibold text-foreground">
          {t("riskProfileDetailTitle")} — {profile?.externalCustomerId ?? externalCustomerId}
        </h1>
      </div>

      {!profile ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <ShieldAlert className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("riskProfileDetailNotFound")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <ScoreCard
              label={t("riskProfilesColWeighted")}
              value={profile.weightedScore}
              hint={t("riskProfileScoreWeightedHint")}
              riskLevel={profile.riskLevel}
              emphasize
              t={t}
            />
            <ScoreCard label={t("riskProfilesColDecayed")} value={profile.decayedScore} hint={t("riskProfileScoreDecayedHint")} t={t} />
            <ScoreCard label={t("riskProfilesColScore")} value={profile.cumulativeScore} hint={t("riskProfileScoreCumulativeHint")} t={t} />
          </div>

          {profile.topCategory ? (
            <p className="text-sm text-muted-foreground">
              {t("riskProfilesColTopCategory")}: <span className="font-semibold text-foreground">{t(CATEGORY_LABEL_KEY[profile.topCategory])}</span>
            </p>
          ) : null}

          <div className="rounded-md border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">{t("riskProfilesBreakdownTitle")}</p>
            <RiskBreakdown breakdown={profile.breakdown} />
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">{t("riskProfileDetailContributionsTitle")}</p>
            {profile.contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("riskProfileDetailNoContributions")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...profile.contributions].reverse().map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{c.source}</span> &mdash; {c.reason}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted-foreground">{new Date(c.at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</span>
                      <span className="font-semibold text-foreground">+{c.points}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">{t("riskProfileHistoryTitle")}</p>
            <RiskHistoryTimeline history={profile.history} />
          </div>

          <ScreeningMatchesSection externalCustomerId={profile.externalCustomerId} initialMatches={screeningMatches} />
        </>
      )}
    </div>
  );
}
