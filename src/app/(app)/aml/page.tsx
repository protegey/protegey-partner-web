import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, FileText, Flag, ShieldAlert, UserCheck, Users } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getAmlSummary, type AmlSummary } from "./actions";

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
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "amlPageTitle")}</h1>
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
