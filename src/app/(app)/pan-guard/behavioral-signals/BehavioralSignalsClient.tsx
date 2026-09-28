"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import type { StringKey } from "@/lib/i18n/strings";
import type { BehavioralSignal, BehavioralCategory } from "./actions";
import type { PaginatedResult } from "../../transactions/actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const BEHAVIORAL_SIGNALS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Signaux comportementaux",
    explanation:
      "Ton SDK envoie en continu des métadonnées de session (rythme de frappe, gestes tactiles, navigation, horaires de connexion, vitesse entre les actions). Protegey apprend d'abord ce qui est « normal » pour chaque client — il faut environ 5 sessions pour construire cette base — puis commence à repérer les écarts.\n\nChaque ligne ici est un écart détecté : un score de déviation, un niveau de confiance (faible/moyen/élevé) et les catégories concernées (frappe, tactile, navigation, horaire de connexion, vitesse de session).\n\nImportant : un signal comportemental isolé ne crée jamais d'alerte à lui seul. Il ne fait remonter une vraie alerte que si la confiance est « élevée » ET qu'un autre signal non-comportemental existe déjà sur ce même client — pour éviter les faux positifs sur un simple changement de téléphone ou de connexion.",
    diagram: [
      [{ label: "SDK partenaire", note: "frappe, tactile, navigation, session" }],
      [{ label: "Base de référence", note: "5 sessions pour apprendre" }],
      [{ label: "Signaux comportementaux", note: "score de déviation + confiance", current: true }],
      [{ label: "Alerte", note: "seulement si confiance élevée + autre signal" }],
    ],
    diagramCaption: "Un signal comportemental seul ne déclenche jamais rien — il doit se combiner à un autre signal.",
  },
  en: {
    title: "Behavioral signals",
    explanation:
      "Your SDK continuously sends session metadata (typing rhythm, touch gestures, navigation, login timing, speed between actions). Protegey first learns what's \"normal\" for each customer — it takes about 5 sessions to build that baseline — then starts spotting deviations.\n\nEach row here is a detected deviation: a deviation score, a confidence tier (low/medium/high), and the categories involved (keystroke, touch, navigation, login time, session velocity).\n\nImportant: an isolated behavioral signal never creates an alert on its own. It only escalates to a real alert when confidence is \"high\" AND another, non-behavioral signal already exists on that same customer — to avoid false positives from something as simple as a new phone or connection.",
    diagram: [
      [{ label: "Partner SDK", note: "keystroke, touch, navigation, session" }],
      [{ label: "Baseline", note: "5 sessions to learn" }],
      [{ label: "Behavioral signals", note: "deviation score + confidence", current: true }],
      [{ label: "Alert", note: "only if high confidence + another signal" }],
    ],
    diagramCaption: "A behavioral signal alone never triggers anything — it must combine with another signal.",
  },
};

const TIER_COLOR: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-600",
  high: "bg-destructive/15 text-destructive",
};

const CATEGORY_LABEL_KEY: Record<BehavioralCategory, StringKey> = {
  keystroke: "behavioralCategoryKeystroke",
  touch: "behavioralCategoryTouch",
  navigation: "behavioralCategoryNavigation",
  login_time: "behavioralCategoryLoginTime",
  session_velocity: "behavioralCategorySessionVelocity",
};

export function BehavioralSignalsClient({
  result,
  page,
  initialCustomer,
  initialTier,
}: {
  result: PaginatedResult<BehavioralSignal>;
  page: number;
  initialCustomer: string;
  initialTier: string;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [customer, setCustomer] = useState(initialCustomer);
  const [tier, setTier] = useState(initialTier);

  const tierLabel: Record<string, string> = {
    low: t("behavioralTierLow"),
    medium: t("behavioralTierMedium"),
    high: t("behavioralTierHigh"),
  };

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (customer) params.set("customer", customer);
    if (tier !== "all") params.set("tier", tier);
    startTransition(() => router.push(`/pan-guard/behavioral-signals?${params.toString()}`));
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("behavioralSignalsPageTitle")}</h1>
          <PageGuideButton content={BEHAVIORAL_SIGNALS_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t("behavioralSignalsPageSubtitle")}</p>
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
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("behavioralFilterTierLabel")}</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("txFilterAllOption")}</option>
            <option value="low">{t("behavioralTierLow")}</option>
            <option value="medium">{t("behavioralTierMedium")}</option>
            <option value="high">{t("behavioralTierHigh")}</option>
          </select>
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
          <Activity className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("behavioralSignalsEmpty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("signalsColWhen")}</th>
                <th className="px-4 py-2.5 font-medium">{t("signalsColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("behavioralColId")}</th>
                <th className="px-4 py-2.5 font-medium">{t("behavioralColSession")}</th>
                <th className="px-4 py-2.5 font-medium">{t("behavioralColDeviationScore")}</th>
                <th className="px-4 py-2.5 font-medium">{t("behavioralColConfidence")}</th>
                <th className="px-4 py-2.5 font-medium">{t("behavioralColCategories")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((signal) => (
                <tr key={signal.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(signal.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{signal.externalCustomerId}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{signal.id}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{signal.sessionId}</td>
                  <td className="px-4 py-2.5 text-foreground">{signal.deviationScore}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLOR[signal.confidenceTier]}`}>
                      {tierLabel[signal.confidenceTier]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {signal.categories.length ? signal.categories.map((c) => t(CATEGORY_LABEL_KEY[c])).join(", ") : "—"}
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
