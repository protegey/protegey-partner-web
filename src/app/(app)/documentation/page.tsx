import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ArrowRightLeft, IdCard, ShieldCheck, Webhook, AlertTriangle } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Documentation — Protegey Partner",
};

const TRANSACTION_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/transactions \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "externalTransactionId": "tx-00234",
    "externalCustomerId": "cust-9981",
    "direction": "DEBIT",
    "amount": 250000,
    "currency": "XOF",
    "transactionType": "cashout",
    "isCash": true,
    "occurredAt": "2026-01-15T10:00:00.000Z",
    "deviceEventId": "evt_optional_device_signal"
  }'

# Response
{
  "transactionId": "b3b4f28f-...",
  "decision": "review",
  "riskScore": 20,
  "alerts": [ { "ruleCode": "IND006-KYC1", "status": "open", ... } ]
}`;

const KYC_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/kyc/sessions \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{ "externalUserId": "cust-9981" }'

# Response
{ "sessionId": "sess_...", "url": "https://verify.didit.me/session/..." }`;

const SANCTIONS_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/sanctions/screen \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{ "name": "Jane Doe", "type": "person" }'

# Response
{
  "decision": "clear",
  "score": 0,
  "matches": []
}`;

function Section({
  id,
  icon: Icon,
  title,
  body,
  children,
}: {
  id: string;
  icon: typeof KeyRound;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {children}
    </section>
  );
}

export default async function DocumentationPage() {
  const lang = await getLang();

  const nav = [
    { id: "auth", label: t(lang, "docsNavAuth") },
    { id: "transactions", label: t(lang, "docsNavTransactions") },
    { id: "kyc", label: t(lang, "docsNavKyc") },
    { id: "sanctions", label: t(lang, "docsNavSanctions") },
    { id: "webhooks", label: t(lang, "docsNavWebhooks") },
    { id: "errors", label: t(lang, "docsNavErrors") },
  ];

  return (
    <div className="mx-auto flex max-w-5xl gap-8">
      <nav className="sticky top-8 hidden h-fit w-48 shrink-0 flex-col gap-1 lg:flex">
        {nav.map((item) => (
          <a key={item.id} href={`#${item.id}`} className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "docsPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t(lang, "docsPageSubtitle")}</p>
        </div>

        <Section id="auth" icon={KeyRound} title={t(lang, "docsAuthTitle")} body={t(lang, "docsAuthBody")} />

        <Section id="transactions" icon={ArrowRightLeft} title={t(lang, "docsTransactionsTitle")} body={t(lang, "docsTransactionsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{TRANSACTION_EXAMPLE}</code>
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsSeeAlsoRules")}</p>
        </Section>

        <Section id="kyc" icon={IdCard} title={t(lang, "docsKycTitle")} body={t(lang, "docsKycBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{KYC_EXAMPLE}</code>
          </pre>
        </Section>

        <Section id="sanctions" icon={ShieldCheck} title={t(lang, "docsSanctionsTitle")} body={t(lang, "docsSanctionsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{SANCTIONS_EXAMPLE}</code>
          </pre>
        </Section>

        <Section id="webhooks" icon={Webhook} title={t(lang, "docsWebhooksTitle")} body={t(lang, "docsWebhooksBody")} />

        <Section id="errors" icon={AlertTriangle} title={t(lang, "docsErrorsTitle")} body={t(lang, "docsErrorsBody")} />

        <p className="text-xs text-muted-foreground">
          <Link href="/integration-guide" className="text-primary hover:underline">
            {t(lang, "navIntegrationGuide")}
          </Link>
        </p>
      </div>
    </div>
  );
}
