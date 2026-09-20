import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ArrowRightLeft, IdCard, ShieldCheck, Webhook, AlertTriangle, Smartphone, Activity, Share2, Package } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { CodeBlock } from "@/components/CodeBlock";

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

const KYC_POLL_EXAMPLE = `# Polling fallback — see the Webhooks section: delivery is best-effort (one retry, no queue).
curl https://api.protegey.com/partner-api/kyc/sessions/sess_... \\
  -H "x-api-key: YOUR_API_KEY"

# Response — identical shape to the outbound webhook payload, minus eventId
{ "sessionId": "sess_...", "externalUserId": "cust-9981", "status": "Approved", "decision": { ... } }`;

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

const WEBHOOK_HEADERS_EXAMPLE = `POST https://your-endpoint.example.com/webhooks/protegey
Content-Type: application/json
X-Signature: 08fa142f2349cd86b4c4c3a46ce53afe5c63c4a587d7ff3cf52023f201c1526d
X-Timestamp: 1789905404`;

const WEBHOOK_KYC_PAYLOAD_EXAMPLE = `{
  "type": "kyc.status_changed",
  "eventId": "d0d61d39-88c5-4bfb-89eb-08bb1d407c5a",
  "externalUserId": "cust-9981",
  "status": "Approved",
  "sessionId": "sess_...",
  "decision": { "id_verifications": [ { "status": "Approved", ... } ], ... }
}`;

const WEBHOOK_ALERT_CREATED_EXAMPLE = `{
  "type": "alert.created",
  "eventId": "77cf7610-5380-4b72-aeaf-35645098140c",
  "alertId": "27bfd203-d554-418a-bc19-fcaf13164a0e",
  "ruleCode": "IND006-KYC1",
  "externalCustomerId": "cust-9981",
  "transactionId": "4d06ad4e-2018-428a-8323-d537da5e19fa",
  "status": "open",
  "triggeredAt": "2026-09-20T12:51:42.593Z"
}
// transactionId is null for an alert escalated from behavioral biometrics (not tied to one transaction).
// Sent even though you may already see this alert in the synchronous response to your own
// POST /partner-api/transactions call — the system that submits transactions isn't necessarily
// the same system that should act on a fraud alert, so it's pushed independently too.`;

const WEBHOOK_ALERT_STATUS_EXAMPLE = `{
  "type": "alert.status_changed",
  "eventId": "31d8d981-1177-476f-b65a-dd69c700bb08",
  "alertId": "27bfd203-d554-418a-bc19-fcaf13164a0e",
  "ruleCode": "IND006-KYC1",
  "externalCustomerId": "cust-9981",
  "status": "confirmed"
}
// Fires when someone on your team changes an alert's status from the portal — the only way
// you'd otherwise learn of it is polling GET /alerts.`;

const WEBHOOK_DISPATCH_EXAMPLE = `// Node.js — dispatch on "type" once you've verified the signature (see below)
switch (event.type) {
  case "kyc.status_changed":
    // event.status, event.externalUserId, event.sessionId, event.decision
    break;
  case "alert.created":
    // event.alertId, event.ruleCode, event.externalCustomerId, event.transactionId
    break;
  case "alert.status_changed":
    // event.alertId, event.status
    break;
  default:
    // Ignore unknown types instead of erroring — new event types get added over time.
    break;
}`;

const WEBHOOK_VERIFY_EXAMPLE = `// Node.js — verify a delivery is genuinely from Protegey and hasn't been replayed
import { createHmac, timingSafeEqual } from "node:crypto";

function isValidProtegeyWebhook(rawBody, signatureHeader, timestampHeader, webhookSecret) {
  // Reject anything older than 5 minutes — the timestamp is signed together with the body,
  // so a captured request can't be replayed later even with a technically-valid signature.
  if (Math.abs(Date.now() / 1000 - Number(timestampHeader)) > 300) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(\`\${timestampHeader}.\${rawBody}\`, "utf8")
    .digest("hex");

  return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
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
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/sdks/js"
              className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(lang, "navSdkJs")}
            </Link>
            <Link
              href="/sdks/flutter"
              className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(lang, "navSdkFlutter")}
            </Link>
          </div>
        </Section>

        <Section id="transactions" icon={ArrowRightLeft} title={t(lang, "docsTransactionsTitle")} body={t(lang, "docsTransactionsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={TRANSACTION_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsSeeAlsoRules")}</p>
        </Section>

        <Section id="kyc" icon={IdCard} title={t(lang, "docsKycTitle")} body={t(lang, "docsKycBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={KYC_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKycPollLabel")}</p>
          <CodeBlock code={KYC_POLL_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsKycPollNote")}</p>
        </Section>

        <Section id="sanctions" icon={ShieldCheck} title={t(lang, "docsSanctionsTitle")} body={t(lang, "docsSanctionsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={SANCTIONS_EXAMPLE} />
        </Section>

        <Section id="device-events" icon={Smartphone} title={t(lang, "docsDeviceEventsTitle")} body={t(lang, "docsDeviceEventsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={DEVICE_EVENT_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/pan-guard/device-signals" className="text-primary hover:underline">
              {t(lang, "docsSeeAlsoDeviceSignals")}
            </Link>
          </p>
        </Section>

        <Section id="behavioral-events" icon={Activity} title={t(lang, "docsBehavioralEventsTitle")} body={t(lang, "docsBehavioralEventsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={BEHAVIORAL_EVENT_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsBehavioralEventsStepUpNote")}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/pan-guard/behavioral-signals" className="text-primary hover:underline">
              {t(lang, "docsSeeAlsoBehavioralSignals")}
            </Link>
          </p>
        </Section>

        <Section id="shared-signal" icon={Share2} title={t(lang, "docsSharedSignalTitle")} body={t(lang, "docsSharedSignalBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={SHARED_SIGNAL_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsSharedSignalOptInNote")}</p>
        </Section>

        <Section id="webhooks" icon={Webhook} title={t(lang, "docsWebhooksTitle")} body={t(lang, "docsWebhooksBody")}>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t(lang, "docsWebhooksSyncNote")}</p>

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsWebhooksEventsTitle")}</p>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">type</th>
                  <th className="px-3 py-2 font-medium">{t(lang, "docsWebhooksColTrigger")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">kyc.status_changed</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksKycTrigger")}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">alert.created</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksAlertCreatedTrigger")}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">alert.status_changed</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksAlertStatusTrigger")}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksMoreTypesNote")}</p>

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsWebhooksHeadersExampleTitle")}</p>
          <CodeBlock code={WEBHOOK_HEADERS_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">kyc.status_changed</p>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {t(lang, "docsWebhooksKycStatusValuesLabel")}: Not Started, In Progress, Awaiting User, In Review, Approved, Declined, Resubmitted, Abandoned, Expired, Kyc Expired
          </p>
          <CodeBlock code={WEBHOOK_KYC_PAYLOAD_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">alert.created</p>
          <CodeBlock code={WEBHOOK_ALERT_CREATED_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">alert.status_changed</p>
          <CodeBlock code={WEBHOOK_ALERT_STATUS_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsWebhooksDispatchTitle")}</p>
          <CodeBlock code={WEBHOOK_DISPATCH_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsWebhooksHeadersTitle")}</p>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">X-Signature</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksHeaderSignature")}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">X-Timestamp</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksHeaderTimestamp")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsWebhooksVerifyTitle")}</p>
          <p className="mb-1.5 text-sm text-muted-foreground">{t(lang, "docsWebhooksVerifyBody")}</p>
          <CodeBlock code={WEBHOOK_VERIFY_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsWebhooksReliabilityTitle")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t(lang, "docsWebhooksReliabilityBody")}</p>

          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/settings/webhooks" className="text-primary hover:underline">
              {t(lang, "navWebhooks")}
            </Link>
          </p>
        </Section>

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
