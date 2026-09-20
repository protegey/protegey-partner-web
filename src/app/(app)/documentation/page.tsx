import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ArrowRightLeft, IdCard, ShieldCheck, Webhook, AlertTriangle, Smartphone, Activity, Share2, Package } from "lucide-react";
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

const DEVICE_EVENT_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/device-events \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "eventId": "your-own-idempotency-key",
    "externalCustomerId": "cust-9981",
    "visitorId": "computed-by-the-sdk",
    "deviceAttributes": { "platform": "Web", "isRooted": false }
  }'

# Response
{ "recorded": true, "action": "allow", "riskScore": 5 }`;

const SDK_JS_INSTALL_GITHUB = `# Not yet on npm — install straight from GitHub for now
npm install git+https://github.com/protegey/protegey_js_sdk.git`;

const SDK_JS_INSTALL_NPM = `# Once published:
npm install @protegey/sdk`;

const SDK_JS_EXAMPLE = `// Works in Node.js, the browser, React, Angular, and React Native — one package.
import { Protegey } from "@protegey/sdk";

// baseUrl has no default on purpose — confirm the current value with Protegey, it can
// change independently of this package (e.g. between staging and production).
const protegey = new Protegey({ apiKey: "YOUR_API_KEY", baseUrl: "https://api.protegey.com" });

// Device intelligence — call on login/session start
const { visitorId, action, riskScore } = await protegey.device.identify({
  externalCustomerId: "cust-9981",
  phoneNumber: "+22890000001", // optional — you already have it, we never read it off the device
});

// Transactions — no need to hand-build the curl call yourself
const result = await protegey.transactions.report({
  externalTransactionId: "tx-00234",
  externalCustomerId: "cust-9981",
  direction: "DEBIT",
  amount: 250000,
  currency: "XOF",
  transactionType: "cashout",
  isCash: true,
  occurredAt: new Date().toISOString(),
});`;

const SDK_FLUTTER_INSTALL_GITHUB = `# pubspec.yaml — not yet on pub.dev, install straight from GitHub for now
dependencies:
  protegey_sdk:
    git:
      url: https://github.com/protegey/protegey_flutter_sdk.git
      ref: main`;

const SDK_FLUTTER_INSTALL_PUBDEV = `# Once published:
flutter pub add protegey_sdk`;

const SDK_FLUTTER_EXAMPLE = `// baseUrl has no default on purpose — confirm the current value with Protegey, it can
// change independently of this package (e.g. between staging and production).
final protegey = Protegey(apiKey: 'YOUR_API_KEY', baseUrl: 'https://api.protegey.com');

final identify = await protegey.device.identify(
  externalCustomerId: 'cust-9981',
  phoneNumber: '+22890000001', // optional
);

final result = await protegey.transactions.report(TransactionInput(
  externalTransactionId: 'tx-00234',
  externalCustomerId: 'cust-9981',
  direction: TransactionDirection.debit,
  amount: 250000,
  currency: 'XOF',
  transactionType: 'cashout',
  isCash: true,
  occurredAt: DateTime.now().toIso8601String(),
));`;

const BEHAVIORAL_EVENT_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/behavioral-events \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "externalCustomerId": "cust-9981",
    "sessionId": "sess-20260115-01",
    "keystroke": { "avgInterKeyLatencyMs": 145, "typingSpeedCharsPerSec": 4.2, "errorRate": 0.02 },
    "touch": { "avgSwipeVelocity": 22, "scrollBehaviorScore": 0.8 },
    "navigation": { "screenSequence": ["login", "dashboard", "transfer", "confirm"] },
    "session": { "loginHourBucket": 14, "loginDayOfWeek": 2, "sessionDurationMs": 45000 }
  }'

# Response — first sessions for a customer come back as "learning" (no score yet)
{ "status": "learning", "deviationScore": 0, "confidenceTier": null, "stepUpRecommended": false, "escalatedAlertId": null }

# Response — once a baseline exists for that customer
{ "status": "scored", "deviationScore": 35, "confidenceTier": "medium", "stepUpRecommended": true, "escalatedAlertId": null }`;

const SHARED_SIGNAL_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/shared-signal/check \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{ "phoneNumber": "+22890123456", "email": "jane@example.com", "deviceFingerprint": "visitor-id-from-the-sdk", "externalCustomerId": "cust-9981" }'
  # phoneNumber, email and deviceFingerprint are all optional — send whichever you have, any combination

# Response — no match
{ "flagged": false, "category": null, "reportedDaysAgo": null }

# Response — a match (never reveals which partner reported it, or their case details)
{ "flagged": true, "category": "confirmed_fraud", "reportedDaysAgo": 12 }`;

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
    { id: "sdks", label: t(lang, "docsNavSdks") },
    { id: "transactions", label: t(lang, "docsNavTransactions") },
    { id: "kyc", label: t(lang, "docsNavKyc") },
    { id: "sanctions", label: t(lang, "docsNavSanctions") },
    { id: "device-events", label: t(lang, "docsNavDeviceEvents") },
    { id: "behavioral-events", label: t(lang, "docsNavBehavioralEvents") },
    { id: "shared-signal", label: t(lang, "docsNavSharedSignal") },
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

        <Section id="sdks" icon={Package} title={t(lang, "docsSdksTitle")} body={t(lang, "docsSdksBody")}>
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsSdksJsLabel")}</p>
            <a
              href="https://github.com/protegey/protegey_js_sdk"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t(lang, "docsSdksSourceLink")}
            </a>
          </div>
          <p className="mb-1.5 text-xs text-muted-foreground">{t(lang, "docsSdksNotPublishedYet")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{SDK_JS_INSTALL_GITHUB}</code>
          </pre>
          <pre className="mt-2 overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-muted-foreground">
            <code>{SDK_JS_INSTALL_NPM}</code>
          </pre>
          <pre className="mt-2 overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{SDK_JS_EXAMPLE}</code>
          </pre>

          <div className="mt-6 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsSdksFlutterLabel")}</p>
            <a
              href="https://github.com/protegey/protegey_flutter_sdk"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t(lang, "docsSdksSourceLink")}
            </a>
          </div>
          <p className="mb-1.5 text-xs text-muted-foreground">{t(lang, "docsSdksNotPublishedYet")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{SDK_FLUTTER_INSTALL_GITHUB}</code>
          </pre>
          <pre className="mt-2 overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-muted-foreground">
            <code>{SDK_FLUTTER_INSTALL_PUBDEV}</code>
          </pre>
          <pre className="mt-2 overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{SDK_FLUTTER_EXAMPLE}</code>
          </pre>

          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsSdksNote")}</p>
        </Section>

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

        <Section id="device-events" icon={Smartphone} title={t(lang, "docsDeviceEventsTitle")} body={t(lang, "docsDeviceEventsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{DEVICE_EVENT_EXAMPLE}</code>
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/pan-guard/device-signals" className="text-primary hover:underline">
              {t(lang, "docsSeeAlsoDeviceSignals")}
            </Link>
          </p>
        </Section>

        <Section id="behavioral-events" icon={Activity} title={t(lang, "docsBehavioralEventsTitle")} body={t(lang, "docsBehavioralEventsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{BEHAVIORAL_EVENT_EXAMPLE}</code>
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsBehavioralEventsStepUpNote")}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/pan-guard/behavioral-signals" className="text-primary hover:underline">
              {t(lang, "docsSeeAlsoBehavioralSignals")}
            </Link>
          </p>
        </Section>

        <Section id="shared-signal" icon={Share2} title={t(lang, "docsSharedSignalTitle")} body={t(lang, "docsSharedSignalBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <pre className="overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs text-foreground">
            <code>{SHARED_SIGNAL_EXAMPLE}</code>
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsSharedSignalOptInNote")}</p>
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
