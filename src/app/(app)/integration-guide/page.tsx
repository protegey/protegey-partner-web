import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, IdCard, ArrowRightLeft, Building2, ShieldCheck, Webhook, ArrowRight, BookOpen, Fingerprint } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const INTEGRATION_GUIDE_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Guide d'intégration",
    explanation:
      "Cette page est le point de départ pour brancher ton propre système sur Protegey : comment envoyer une transaction à évaluer, démarrer une vérification KYC, cribler un nom contre les sanctions, inviter une entreprise cliente (KYB), ou envoyer un signal d'appareil.\n\nChaque carte pointe vers la page correspondante du produit et montre un exemple d'appel API réel (avec ta clé API dans l'en-tête `x-api-key`) pour que tu puisses copier-coller et tester tout de suite.\n\nC'est une page de référence : elle n'affiche aucune donnée de ton compte, elle explique juste comment t'y brancher.",
  },
  en: {
    title: "Integration guide",
    explanation:
      "This page is the starting point for wiring your own system into Protegey: how to send a transaction for scoring, start a KYC verification, screen a name against sanctions, invite a business client (KYB), or send a device signal.\n\nEach card points to the matching product page and shows a real API call example (with your API key in the `x-api-key` header) so you can copy, paste, and test right away.\n\nThis is a reference page: it doesn't show any of your account's data, it just explains how to plug into it.",
  },
};

const TRANSACTION_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/transactions \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "externalTransactionId": "tx-00234",
    "externalCustomerId": "cust-9981",
    "direction": "DEBIT",
    "amount": 250000,
    "transactionType": "cashout",
    "occurredAt": "2026-01-15T10:00:00.000Z"
  }'`;

export default async function IntegrationGuidePage() {
  const lang = await getLang();

  const useCases = [
    { icon: IdCard, title: t(lang, "igCardKycTitle"), body: t(lang, "igCardKycBody"), href: "/kyc" },
    { icon: ArrowRightLeft, title: t(lang, "igCardTxTitle"), body: t(lang, "igCardTxBody"), href: "/transactions" },
    { icon: ShieldCheck, title: t(lang, "igCardSanctionsTitle"), body: t(lang, "igCardSanctionsBody"), href: "/sanctions" },
    { icon: Building2, title: t(lang, "igCardKybTitle"), body: t(lang, "igCardKybBody"), href: "/clients" },
    { icon: Fingerprint, title: t(lang, "igCardSignalsTitle"), body: t(lang, "igCardSignalsBody"), href: "/pan-guard/device-signals" },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "igHeroTitle")}</h1>
          <PageGuideButton content={INTEGRATION_GUIDE_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "igHeroSubtitle")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</div>
          <p className="text-sm font-semibold text-foreground">{t(lang, "igStep1Title")}</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t(lang, "igStep1Body")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href="/settings/api-keys"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <KeyRound className="size-4" />
            {t(lang, "igStep1Button")}
          </Link>
          <Link href="/documentation#sdks" className="text-sm font-medium text-primary hover:underline">
            {t(lang, "igStep1SdkLink")}
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t(lang, "igStep2Title")}</p>
            <p className="text-xs text-muted-foreground">{t(lang, "igStep2Subtitle")}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase) => (
            <Link
              key={useCase.title}
              href={useCase.href}
              className="group flex flex-col gap-2 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <useCase.icon className="size-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">{useCase.title}</p>
              <p className="flex-1 text-xs text-muted-foreground">{useCase.body}</p>
              <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-3 rounded-md border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{TRANSACTION_EXAMPLE}</code>
          </pre>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</div>
          <p className="text-sm font-semibold text-foreground">{t(lang, "igStep3Title")}</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t(lang, "igStep3Body")}</p>
        <Link
          href="/settings/webhooks"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Webhook className="size-4" />
          {t(lang, "igStep1Button")}
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-border p-5">
        <div>
          <p className="text-sm font-semibold text-foreground">{t(lang, "igMoreDetailTitle")}</p>
          <p className="text-xs text-muted-foreground">{t(lang, "igMoreDetailBody")}</p>
        </div>
        <Link
          href="/documentation"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <BookOpen className="size-4" />
          {t(lang, "igMoreDetailButton")}
        </Link>
      </div>
    </div>
  );
}
