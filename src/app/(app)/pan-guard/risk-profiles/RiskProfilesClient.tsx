"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import type { StringKey } from "@/lib/i18n/strings";
import { exportRiskProfilesAction, type EntityRiskProfile } from "./actions";
import type { PaginatedResult } from "../../transactions/actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";
import { riskProfileReason } from "./riskProfileReason";

const RISK_PROFILES_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Profils de risque",
    explanation:
      "Chaque ligne ici est un client : un score de risque (0 à 100) et la raison principale derrière — calculés à partir de tout ce qui lui est arrivé : alertes, signaux d'appareil, signaux comportementaux, criblage sanctions/PPE. Plus le score est haut, plus il faut se méfier.\n\nLe score ne redescend jamais tout seul, mais un incident ancien pèse de moins en moins avec le temps — un client qui a eu un souci il y a 6 mois et plus rien depuis n'est pas traité comme s'il posait toujours problème aujourd'hui.\n\nClique sur un client pour voir le détail complet : son historique, les correspondances de criblage, et — si besoin — le calcul exact derrière le score.",
    diagram: [
      [
        { label: "Règles de transaction", note: "Pan-Monitor" },
        { label: "Signaux d'appareil", note: "Pan-Guard" },
        { label: "KYC / Sanctions / PPE" },
        { label: "Biométrie comportementale" },
      ],
      [{ label: "Profils de risque", note: "liste — un score par client", current: true }],
      [{ label: "Alerte", note: "si le score franchit un seuil" }],
    ],
  },
  en: {
    title: "Risk profiles",
    explanation:
      "Each row here is a customer: a risk score (0 to 100) and the main reason behind it — built from everything that's happened to them: alerts, device signals, behavioral signals, sanctions/PEP screening. The higher the score, the more caution is warranted.\n\nThe score never goes down on its own, but an old incident counts for less over time — a customer who had an issue 6 months ago and nothing since isn't treated as if they're still a concern today.\n\nClick a customer to see the full detail: their history, screening matches, and — if you need it — the exact calculation behind the score.",
    diagram: [
      [
        { label: "Transaction rules", note: "Pan-Monitor" },
        { label: "Device signals", note: "Pan-Guard" },
        { label: "KYC / Sanctions / PEP" },
        { label: "Behavioral biometrics" },
      ],
      [{ label: "Risk profiles", note: "list — one score per customer", current: true }],
      [{ label: "Alert", note: "if the score crosses a threshold" }],
    ],
  },
};

type RiskLevel = EntityRiskProfile["riskLevel"];

/** Semantic, not the app's accent color — a risk level reads the same everywhere it appears. */
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

function RiskLevelBadge({ level, t }: { level: RiskLevel; t: (key: StringKey) => string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_LEVEL_STYLES[level]}`}>{t(RISK_LEVEL_LABEL_KEY[level])}</span>;
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

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (customer) params.set("customer", customer);
    startTransition(() => router.push(`/pan-guard/risk-profiles?${params.toString()}`));
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("riskProfilesPageTitle")}</h1>
          <PageGuideButton content={RISK_PROFILES_GUIDE[lang]} />
        </div>
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
        <div className="ml-auto">
          <ExportCsvButton
            filename="risk-profiles-export.csv"
            onExport={() => exportRiskProfilesAction({ externalCustomerId: customer || undefined })}
          />
        </div>
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
                <th className="px-4 py-2.5 font-medium">{t("signalsColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfileScoreLabel")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColReason")}</th>
                <th className="px-4 py-2.5 font-medium">{t("riskProfilesColLastUpdated")}</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((profile) => (
                <tr key={profile.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2.5 text-foreground">{profile.externalCustomerId}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">{profile.weightedScore.toFixed(0)}</span>
                      <RiskLevelBadge level={profile.riskLevel} t={t} />
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-2.5 text-xs text-muted-foreground">{riskProfileReason(profile, t)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(profile.updatedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/pan-guard/risk-profiles/${encodeURIComponent(profile.externalCustomerId)}`}
                      className="ml-auto flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Eye className="size-3.5" />
                      {t("riskProfilesViewDetail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={applyFilters} />
    </div>
  );
}
