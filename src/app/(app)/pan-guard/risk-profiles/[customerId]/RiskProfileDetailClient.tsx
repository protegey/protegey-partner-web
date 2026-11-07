"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { RiskBreakdown } from "../RiskBreakdown";
import { RiskHistoryTimeline } from "./RiskHistoryTimeline";
import { ScreeningMatchesSection } from "./ScreeningMatchesSection";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";
import { riskProfileReason } from "../riskProfileReason";
import type { StringKey } from "@/lib/i18n/strings";
import type { EntityRiskProfile } from "../actions";
import type { ScreeningMatch } from "../../../sanctions/actions";

const RISK_PROFILE_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Profil de risque",
    explanation:
      "Cette page répond à une seule question : « est-ce que ce client est risqué, et pourquoi ? »\n\nLe score que tu vois n'est pas inventé au hasard — il monte à chaque fois que quelque chose de suspect arrive à ce client (une grosse transaction, un appareil signalé, une correspondance sur une liste de sanctions…). Il ne redescend jamais tout seul, mais un incident ancien compte de moins en moins avec le temps.\n\nLe niveau affiché (Faible/Modéré/Élevé/Critique) traduit ce score en une couleur simple à comprendre d'un coup d'œil. La phrase juste en dessous dit pourquoi ce score est ce qu'il est, en une ligne. Si tu veux le détail exact du calcul (poids par catégorie, historique brut des points), c'est replié plus bas — pas besoin d'y toucher au quotidien.",
    diagram: [
      [
        { label: "Règles de transaction", note: "Pan-Monitor" },
        { label: "Signaux d'appareil", note: "Pan-Guard" },
        { label: "KYC / Sanctions / PPE", note: "Pan-ID, Pan-Risk" },
        { label: "Biométrie comportementale", note: "Pan-Guard" },
      ],
      [{ label: "Profil de risque", note: "score cumulé + pondéré", current: true }],
      [{ label: "Alerte", note: "si le score franchit un seuil" }],
      [{ label: "Dossier / SAR", note: "si l'alerte est confirmée" }],
    ],
    diagramCaption: "Chaque module du produit peut faire monter ce score — c'est le seul endroit où tous les signaux se rejoignent.",
  },
  en: {
    title: "Risk profile",
    explanation:
      "This page answers one question: \"is this customer risky, and why?\"\n\nThe score you see isn't made up — it rises every time something suspicious happens to this customer (a large transaction, a flagged device, a sanctions-list match…). It never goes down on its own, but an old incident counts for less over time.\n\nThe level shown (Low/Medium/High/Critical) turns that score into a color you can understand at a glance. The line right below it says why the score is what it is, in one sentence. If you want the exact calculation (weights per category, the raw point history), it's collapsed further down — no need to touch it day to day.",
    diagram: [
      [
        { label: "Transaction rules", note: "Pan-Monitor" },
        { label: "Device signals", note: "Pan-Guard" },
        { label: "KYC / Sanctions / PEP", note: "Pan-ID, Pan-Risk" },
        { label: "Behavioral biometrics", note: "Pan-Guard" },
      ],
      [{ label: "Risk profile", note: "cumulative + weighted score", current: true }],
      [{ label: "Alert", note: "if the score crosses a threshold" }],
      [{ label: "Case / SAR", note: "if the alert is confirmed" }],
    ],
    diagramCaption: "Every module in the product can raise this score — it's the one place every signal converges.",
  },
};

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link href="/pan-guard/risk-profiles" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t("riskProfileDetailBackToList")}
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            {t("riskProfileDetailTitle")} — {profile?.externalCustomerId ?? externalCustomerId}
          </h1>
          <PageGuideButton content={RISK_PROFILE_GUIDE[lang]} />
        </div>
      </div>

      {!profile ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <ShieldAlert className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("riskProfileDetailNotFound")}</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border border-primary bg-primary/5 p-5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("riskProfileScoreLabel")}</span>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-4xl font-bold text-foreground">{profile.weightedScore.toFixed(0)}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_LEVEL_STYLES[profile.riskLevel]}`}>
                {t(RISK_LEVEL_LABEL_KEY[profile.riskLevel])}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{riskProfileReason(profile, t)}</p>
          </div>

          <div className="rounded-md border border-border bg-card">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center gap-2 p-4 text-left text-sm font-medium text-foreground"
            >
              {showAdvanced ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              {showAdvanced ? t("riskProfileAdvancedToggleHide") : t("riskProfileAdvancedToggleShow")}
            </button>
            {showAdvanced ? (
              <div className="flex flex-col gap-4 border-t border-border p-4">
                <p className="text-xs text-muted-foreground">{t("riskProfileAdvancedIntro")}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("riskProfilesColDecayed")}</p>
                    <p className="text-lg font-semibold text-foreground">{profile.decayedScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t("riskProfileScoreDecayedHint")}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("riskProfilesColScore")}</p>
                    <p className="text-lg font-semibold text-foreground">{profile.cumulativeScore}</p>
                    <p className="text-xs text-muted-foreground">{t("riskProfileScoreCumulativeHint")}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("riskProfilesBreakdownTitle")}</p>
                  <RiskBreakdown breakdown={profile.breakdown} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("riskProfileDetailContributionsTitle")}</p>
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
              </div>
            ) : null}
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
