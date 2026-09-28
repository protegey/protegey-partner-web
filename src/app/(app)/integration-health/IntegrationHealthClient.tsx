"use client";

import Link from "next/link";
import { KeyRound, Webhook, ArrowRightLeft, Fingerprint, Activity, IdCard, CheckCircle2, XCircle } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";
import type { IntegrationChannelHealth, IntegrationChannelKey, IntegrationGrade, IntegrationHealthReport } from "./actions";
import type { StringKey } from "@/lib/i18n/strings";

const INTEGRATION_HEALTH_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "État de l'intégration",
    explanation:
      "Cette page répond à une question simple : « mon système envoie-t-il vraiment des données à Protegey ? ». Chaque type de signal (transactions, appareils, comportement, KYC) est vérifié séparément — actif si au moins un événement est arrivé dans les 30 derniers jours.\n\nLe score global combine la couverture de ces canaux avec la configuration de ta clé API et de ton webhook. Il ne mesure que ce qui est réellement observable aujourd'hui — pas de taux de succès de webhook inventé, par exemple, tant que ce n'est pas vraiment suivi.\n\nSi un canal apparaît inactif alors que tu penses l'utiliser, c'est le signe le plus rapide que quelque chose s'est cassé côté intégration — avant même qu'un client ne s'en plaigne.",
    diagram: [
      [
        { label: "Transactions", note: "API / SDK" },
        { label: "Signaux d'appareil", note: "SDK" },
        { label: "Signaux comportementaux", note: "SDK" },
        { label: "KYC", note: "Didit / FaceTec" },
      ],
      [{ label: "État de l'intégration", note: "couverture + clé API + webhook", current: true }],
    ],
  },
  en: {
    title: "Integration health",
    explanation:
      "This page answers a simple question: \"is my system actually sending data to Protegey?\" Each signal type (transactions, devices, behavior, KYC) is checked independently — active if at least one event arrived in the last 30 days.\n\nThe overall score combines that channel coverage with whether your API key and webhook are configured. It only measures what's genuinely observable today — no invented webhook success rate, for instance, until that's actually tracked.\n\nIf a channel shows inactive when you think you're using it, that's the fastest sign something broke on the integration side — before a customer even notices.",
    diagram: [
      [
        { label: "Transactions", note: "API / SDK" },
        { label: "Device signals", note: "SDK" },
        { label: "Behavioral signals", note: "SDK" },
        { label: "KYC", note: "Didit / FaceTec" },
      ],
      [{ label: "Integration health", note: "coverage + API key + webhook", current: true }],
    ],
  },
};

const GRADE_STYLES: Record<IntegrationGrade, string> = {
  excellent: "bg-emerald-500/15 text-emerald-600",
  good: "bg-sky-500/15 text-sky-600",
  fair: "bg-amber-500/15 text-amber-600",
  poor: "bg-destructive/15 text-destructive",
};

const GRADE_LABEL_KEY: Record<IntegrationGrade, StringKey> = {
  excellent: "integrationHealthGradeExcellent",
  good: "integrationHealthGradeGood",
  fair: "integrationHealthGradeFair",
  poor: "integrationHealthGradePoor",
};

const CHANNEL_ICON: Record<IntegrationChannelKey, typeof ArrowRightLeft> = {
  transactions: ArrowRightLeft,
  deviceSignals: Fingerprint,
  behavioralSignals: Activity,
  kyc: IdCard,
};

const CHANNEL_LABEL_KEY: Record<IntegrationChannelKey, StringKey> = {
  transactions: "navTransactions",
  deviceSignals: "navDeviceSignals",
  behavioralSignals: "navBehavioralSignals",
  kyc: "navKyc",
};

const CHANNEL_LINK: Record<IntegrationChannelKey, string> = {
  transactions: "/transactions",
  deviceSignals: "/pan-guard/device-signals",
  behavioralSignals: "/pan-guard/behavioral-signals",
  kyc: "/kyc",
};

function ChannelCard({ channel, locale, t }: { channel: IntegrationChannelHealth; locale: string; t: (key: StringKey) => string }) {
  const Icon = CHANNEL_ICON[channel.key];
  return (
    <Link href={CHANNEL_LINK[channel.key]} className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Icon className="size-4 text-muted-foreground" />
          {t(CHANNEL_LABEL_KEY[channel.key])}
        </span>
        {channel.active ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
          <XCircle className="size-4 text-muted-foreground" />
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{channel.recentCount}</p>
      <p className="text-xs text-muted-foreground">{t("integrationHealthRecentCountSuffix")}</p>
      <p className="text-xs text-muted-foreground">
        {t("integrationHealthTotalCountPrefix")} {channel.totalCount.toLocaleString(locale)}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("integrationHealthLastReceivedPrefix")} {channel.lastReceivedAt ? new Date(channel.lastReceivedAt).toLocaleString(locale) : t("integrationHealthNever")}
      </p>
    </Link>
  );
}

export function IntegrationHealthClient({ report }: { report: IntegrationHealthReport }) {
  const { t, lang } = useLang();
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("navIntegrationHealth")}</h1>
          <PageGuideButton content={INTEGRATION_HEALTH_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t("integrationHealthPageSubtitle").replace("{n}", String(report.windowDays))}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col items-center justify-center rounded-full border-4 border-border p-4">
          <span className="text-3xl font-bold text-foreground">{report.score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${GRADE_STYLES[report.grade]}`}>{t(GRADE_LABEL_KEY[report.grade])}</span>
          <p className="text-sm text-muted-foreground">{t("integrationHealthScoreExplainer")}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/settings/api-keys" className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:bg-muted/50">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <KeyRound className="size-4 text-muted-foreground" />
            {t("navApiKeys")}
          </span>
          {report.apiKeyConfigured ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="size-3.5" />{t("integrationHealthConfigured")}</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><XCircle className="size-3.5" />{t("integrationHealthNotConfigured")}</span>
          )}
        </Link>
        <Link href="/settings/webhooks" className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:bg-muted/50">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Webhook className="size-4 text-muted-foreground" />
            {t("navWebhooks")}
          </span>
          {report.webhookConfigured ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="size-3.5" />{t("integrationHealthConfigured")}</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><XCircle className="size-3.5" />{t("integrationHealthNotConfigured")}</span>
          )}
        </Link>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">{t("integrationHealthChannelsTitle")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.channels.map((channel) => (
            <ChannelCard key={channel.key} channel={channel} locale={locale} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
