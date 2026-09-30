import type { Metadata } from "next";
import { getMyContract, getMyContractUsage } from "./actions";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const BILLING_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Facturation",
    explanation:
      "Cette page montre votre contrat commercial avec Protegey — le prix standard, une éventuelle remise négociée, le volume de transactions inclus et le tarif appliqué au-delà. Le KYC, le KYB et le criblage sont tous inclus dans ce prix : vous n'êtes facturé que sur le volume de transactions.\n\nCe contrat est configuré par votre chargé de compte Protegey — tu ne peux pas le modifier toi-même ici.",
  },
  en: {
    title: "Billing",
    explanation:
      "This page shows your commercial contract with Protegey — the standard price, any negotiated discount, the included transaction volume, and the rate applied above it. KYC, KYB and screening are all included in this price: you're only billed on transaction volume.\n\nThis contract is configured by your Protegey account manager — you can't edit it yourself here.",
  },
};

export const metadata: Metadata = {
  title: "Billing — Protegey Partner",
};

function formatDiscount(discountType: "percent" | "fixed", discountValue: string, currency: string, lang: "en" | "fr"): string {
  const value = Number(discountValue);
  if (!value) return t(lang, "contractNoDiscount");
  if (discountType === "percent") return `${value}%`;
  return `${value.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} ${currency} (${t(lang, "contractDiscountTypeFixedSuffix")})`;
}

export default async function BillingPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_billing", lang);
  if (denied) return denied;

  const [contract, usage] = await Promise.all([getMyContract(), getMyContractUsage()]);
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "billingPageTitle")}</h1>
          <PageGuideButton content={BILLING_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "billingPageSubtitle")}</p>
      </div>

      {!contract ? (
        <div className="rounded-md border border-border bg-card p-6 text-center">
          <p className="text-sm font-semibold text-foreground">{t(lang, "billingNoContractTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t(lang, "billingNoContractHint")}</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border border-border bg-card p-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">{t(lang, "contractFieldStandardMonthlyFee")}</dt>
                <dd className="mt-0.5 text-lg font-semibold text-foreground">
                  {Number(contract.standardMonthlyFee).toLocaleString(locale, { minimumFractionDigits: 2 })} {contract.currency}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t(lang, "contractFieldDiscount")}</dt>
                <dd className="mt-0.5 text-lg font-semibold text-foreground">
                  {formatDiscount(contract.discountType, contract.discountValue, contract.currency, lang)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t(lang, "contractFieldIncludedTransactions")}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                  {Number(contract.includedTransactions).toLocaleString(locale)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t(lang, "contractFieldOverageRate")}</dt>
                <dd className="mt-0.5 text-lg font-semibold text-foreground">
                  {Number(contract.overageRate).toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {contract.currency}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t(lang, "contractFieldPaymentTerms")}</dt>
                <dd className="mt-0.5 text-lg font-semibold text-foreground">
                  {contract.paymentTermsDays} {t(lang, "contractPaymentTermsDaysSuffix")}
                </dd>
              </div>
            </dl>
          </div>

          {usage ? (
            <div className="rounded-md border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground">{t(lang, "billingUsageSectionTitle")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t(lang, "billingUsageSectionHint")}</p>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t(lang, "billingUsageIncludedLabel")}</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {Number(usage.includedTransactions).toLocaleString(locale)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t(lang, "billingUsageConsumedLabel")}</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{usage.consumedTransactions.toLocaleString(locale)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t(lang, "billingUsageOverageLabel")}</p>
                  <p className={`text-lg font-semibold tabular-nums ${usage.overageTransactions > 0 ? "text-destructive" : "text-foreground"}`}>
                    {usage.overageTransactions.toLocaleString(locale)}
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    usage.percentUsed >= 100 ? "bg-destructive" : usage.percentUsed >= 80 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {usage.percentUsed}% · {t(lang, "billingUsageCyclePeriodBefore")}
                {new Date(usage.cycleStart).toLocaleDateString(locale)}
                {t(lang, "billingUsageCyclePeriodJoiner")}
                {new Date(usage.cycleEnd).toLocaleDateString(locale)}
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
