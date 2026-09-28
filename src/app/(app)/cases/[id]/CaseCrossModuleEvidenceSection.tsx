"use client";

import Link from "next/link";
import { ShieldAlert, Fingerprint, Radar } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import type { CrossModuleEvidence } from "../actions";

const RISK_LEVEL_STYLES: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-600",
  medium: "bg-amber-500/15 text-amber-600",
  high: "bg-orange-500/15 text-orange-600",
  critical: "bg-destructive/15 text-destructive",
};

const RISK_LEVEL_LABEL_KEY: Record<string, "riskLevelLow" | "riskLevelMedium" | "riskLevelHigh" | "riskLevelCritical"> = {
  low: "riskLevelLow",
  medium: "riskLevelMedium",
  high: "riskLevelHigh",
  critical: "riskLevelCritical",
};

const DEVICE_ACTION_COLOR: Record<string, string> = {
  allow: "bg-emerald-500/15 text-emerald-600",
  soft_challenge: "bg-amber-500/15 text-amber-600",
  hard_challenge: "bg-orange-500/15 text-orange-600",
  block: "bg-destructive/15 text-destructive",
};

export function CaseCrossModuleEvidenceSection({ evidence, externalCustomerId }: { evidence: CrossModuleEvidence; externalCustomerId: string }) {
  const { t, lang } = useLang();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const hasAnything = evidence.riskProfile || evidence.screeningMatches.length > 0 || evidence.deviceSignals.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{t("caseCrossModuleEvidenceTitle")}</p>
      <p className="text-xs text-muted-foreground">{t("caseCrossModuleEvidenceHint")}</p>

      {!hasAnything ? (
        <p className="text-sm text-muted-foreground">{t("caseCrossModuleEvidenceEmpty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Radar className="size-3.5" />
              {t("caseCrossModuleRiskProfileTitle")}
            </p>
            {evidence.riskProfile ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">{evidence.riskProfile.weightedScore}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISK_LEVEL_STYLES[evidence.riskProfile.riskLevel]}`}>
                    {t(RISK_LEVEL_LABEL_KEY[evidence.riskProfile.riskLevel])}
                  </span>
                </div>
                <Link href={`/pan-guard/risk-profiles/${externalCustomerId}`} className="text-xs text-primary hover:underline">
                  {t("caseCrossModuleViewFull")}
                </Link>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("caseCrossModuleNoData")}</p>
            )}
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldAlert className="size-3.5" />
              {t("caseCrossModuleScreeningTitle")}
            </p>
            {evidence.screeningMatches.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {evidence.screeningMatches.map((match) => (
                  <li key={match.id} className="text-xs">
                    <p className="font-medium text-foreground">{match.matchedName}{match.isPep ? " · PPE" : ""}</p>
                    <p className="text-muted-foreground">{Math.round(match.matchScore * 100)}% · {match.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">{t("caseCrossModuleNoData")}</p>
            )}
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Fingerprint className="size-3.5" />
              {t("caseCrossModuleDeviceTitle")}
            </p>
            {evidence.deviceSignals.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {evidence.deviceSignals.map((signal) => (
                  <li key={signal.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${DEVICE_ACTION_COLOR[signal.action] ?? "bg-muted text-muted-foreground"}`}>
                      {signal.action}
                    </span>
                    <span className="text-muted-foreground">{new Date(signal.createdAt).toLocaleDateString(locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">{t("caseCrossModuleNoData")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
