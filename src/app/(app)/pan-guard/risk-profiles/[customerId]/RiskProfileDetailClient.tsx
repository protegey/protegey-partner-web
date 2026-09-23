"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { RiskBreakdown } from "../RiskBreakdown";
import type { StringKey } from "@/lib/i18n/strings";
import type { EntityRiskProfile, RiskProfileCategory } from "../actions";

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

function ScoreCard({ label, value, hint, emphasize }: { label: string; value: number; hint: string; emphasize?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 rounded-md border p-4 ${emphasize ? "border-primary bg-primary/5" : "border-border bg-card"}`} title={hint}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-3xl font-bold ${scoreColor(value)}`}>{value.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

export function RiskProfileDetailClient({
  profile,
  externalCustomerId,
}: {
  profile: EntityRiskProfile | null;
  externalCustomerId?: string;
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
              emphasize
            />
            <ScoreCard label={t("riskProfilesColDecayed")} value={profile.decayedScore} hint={t("riskProfileScoreDecayedHint")} />
            <ScoreCard label={t("riskProfilesColScore")} value={profile.cumulativeScore} hint={t("riskProfileScoreCumulativeHint")} />
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
        </>
      )}
    </div>
  );
}
