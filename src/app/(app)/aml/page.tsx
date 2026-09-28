import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, FileText, Flag, ShieldAlert, UserCheck, Users } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getAmlSummary, type AmlSummary } from "./actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const AML_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Tableau de bord AML",
    explanation:
      "Cette page rassemble en un coup d'œil tout ce qui touche à la conformité (lutte anti-blanchiment) : les alertes ouvertes, confirmées, en retard ou escaladées, les personnes politiquement exposées (PPE) confirmées ou en attente de revue, et les déclarations de soupçon (SAR/STR) encore en brouillon ou déjà transmises.\n\nElle ne calcule rien elle-même — chaque chiffre est un raccourci vers la page qui gère vraiment ce sujet (Alertes, Contrôle PPE, SAR/STR). C'est le point de départ quand un responsable conformité veut savoir « qu'est-ce qui a besoin de mon attention aujourd'hui ? » sans naviguer dans tout le produit.",
    diagram: [
      [
        { label: "Alertes", note: "ouvertes / confirmées / escaladées" },
        { label: "Contrôle PPE" },
        { label: "SAR/STR" },
      ],
      [{ label: "Tableau de bord AML", note: "vue agrégée, sans calcul propre", current: true }],
    ],
    diagramCaption: "Chaque carte est un raccourci vers la page source — rien n'est décidé ici.",
  },
  en: {
    title: "AML dashboard",
    explanation:
      "This page rolls up everything compliance-related (anti-money-laundering) in one glance: open, confirmed, overdue or escalated alerts, confirmed or pending-review Politically Exposed Persons (PEPs), and suspicious activity reports (SAR/STR) still in draft or already submitted.\n\nIt doesn't calculate anything itself — every number here is a shortcut to the page that actually manages that topic (Alerts, PEP Control, SAR/STR). It's the starting point when a compliance officer wants to know \"what needs my attention today?\" without hunting through the whole product.",
    diagram: [
      [
        { label: "Alerts", note: "open / confirmed / escalated" },
        { label: "PEP Control" },
        { label: "SAR/STR" },
      ],
      [{ label: "AML dashboard", note: "aggregated view, no logic of its own", current: true }],
    ],
    diagramCaption: "Every card is a shortcut to the source page — nothing is decided here.",
  },
};

export const metadata: Metadata = { title: "AML Dashboard — Protegey Partner" };

type Card = {
  key: keyof AmlSummary;
  label: Parameters<typeof t>[1];
  href: string;
  icon: typeof ShieldAlert;
};

const cards: Card[] = [
  { key: "openAlerts", label: "amlOpenAlerts", href: "/alerts?status=open", icon: ShieldAlert },
  { key: "confirmedAlerts", label: "amlConfirmedAlerts", href: "/alerts?status=confirmed", icon: ClipboardCheck },
  { key: "overdueAlerts", label: "amlOverdueAlerts", href: "/alerts", icon: AlertTriangle },
  { key: "escalatedAlerts", label: "amlEscalatedAlerts", href: "/alerts", icon: Flag },
  { key: "confirmedPep", label: "amlConfirmedPep", href: "/pep?status=confirmed", icon: UserCheck },
  { key: "pepReviews", label: "amlPepReviews", href: "/pep?status=possible_match", icon: Users },
  { key: "sarDrafts", label: "amlSarDrafts", href: "/sar-str?status=draft", icon: FileText },
  { key: "sarSubmitted", label: "amlSarSubmitted", href: "/sar-str?status=submitted", icon: ClipboardCheck },
];

export default async function AmlPage() {
  const [summary, lang] = await Promise.all([getAmlSummary(), getLang()]);
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "amlPageTitle")}</h1>
          <PageGuideButton content={AML_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "amlPageSubtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ key, label, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <Icon className="size-4 text-primary" />
            <p className="mt-2 text-xl font-semibold text-foreground">{summary[key].toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{t(lang, label)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
