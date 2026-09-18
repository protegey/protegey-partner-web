import type { Metadata } from "next";
import Link from "next/link";
import { Activity, IdCard, Building2, Users } from "lucide-react";
import { getUsageSummary } from "./actions";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Usage & Quotas — Protegey Partner",
};

export default async function UsagePage() {
  const [usage, lang] = await Promise.all([getUsageSummary(), getLang()]);
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  const cards = [
    { label: t(lang, "usageStatTransactions"), value: usage.transactionsThisMonth, icon: Activity },
    { label: t(lang, "usageStatKyc"), value: usage.kycSessionsThisMonth, icon: IdCard },
    { label: t(lang, "usageStatClients"), value: usage.clientsInvitedTotal, icon: Building2 },
    { label: t(lang, "usageStatTeam"), value: usage.teamMembersTotal, icon: Users },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "usagePageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "usagePageSubtitle")}</p>
        <p className="mt-1 text-xs font-medium uppercase text-muted-foreground">{t(lang, "usageWindowLabel")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-card p-5">
            <card.icon className="size-5 text-primary" />
            <p className="mt-2 text-2xl font-semibold text-foreground">{card.value.toLocaleString(locale)}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {t(lang, "usagePlanNote")}{" "}
        <Link href="/settings/billing" className="text-primary hover:underline">
          {t(lang, "billingPageTitle")}
        </Link>
      </p>
    </div>
  );
}
