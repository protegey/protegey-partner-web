import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ArrowRightLeft, IdCard, ShieldCheck, Webhook, AlertTriangle, Smartphone, Activity, Share2, Package, Building2 } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { CodeBlock } from "@/components/CodeBlock";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";
import { ApiConsole } from "@/components/ApiConsole";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

const DOCUMENTATION_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Documentation",
    explanation:
      "Cette page est la référence technique complète de l'API Protegey : authentification par clé API, les SDKs disponibles, comment envoyer une transaction, démarrer une vérification KYC, cribler des sanctions, envoyer un signal d'appareil, configurer un webhook, et plus.\n\nChaque section a un exemple de requête `curl` réel avec les vrais noms de champs attendus — tu peux copier-coller et adapter directement dans ton propre backend.\n\nCertaines sections ont aussi une vraie console « Envoyer » intégrée : colle ta clé API et envoie une vraie requête directement depuis cette page, sans sortir de l'application. Ta clé reste uniquement dans ton navigateur, jamais transmise ailleurs.",
  },
  en: {
    title: "Documentation",
    explanation:
      "This page is the full technical reference for the Protegey API: API key authentication, the available SDKs, how to send a transaction, start a KYC verification, screen sanctions, send a device signal, set up a webhook, and more.\n\nEvery section has a real `curl` example with the actual expected field names — you can copy-paste and adapt it directly into your own backend.\n\nSome sections also have a real embedded \"Send\" console: paste your API key and fire a real request straight from this page, without leaving the app. Your key stays in your browser only, never sent anywhere else.",
  },
};

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
    "channel": "USSD",
    "counterpartyInstitutionCode": "ECOBKTGTG",
    "counterpartyCountry": "SN",
    "occurredAt": "2026-01-15T10:00:00.000Z"
  }'

# Response
{
  "transactionId": "b3b4f28f-...",
  "decision": "REVIEW",
  "riskScore": 20,
  "alerts": [ { "ruleCode": "IND006-KYC1", "status": "OPEN", ... } ]
}`;

const TRANSACTION_STATUS_EXAMPLE = `# Looked up by YOUR OWN externalTransactionId — never Protegey's internal id, so you never have
# to learn or persist a second identifier just to ask "what happened to the one I sent you".
curl https://api.protegey.com/partner-api/transactions/tx-00234 \\
  -H "x-api-key: YOUR_API_KEY"

# Response — same shape as the synchronous POST response above
{
  "transactionId": "b3b4f28f-...",
  "externalTransactionId": "tx-00234",
  "externalCustomerId": "cust-9981",
  "decision": "REVIEW",
  "riskScore": 20,
  "deviceAction": "ALLOW",
  "occurredAt": "2026-01-15T10:00:00.000Z",
  "createdAt": "2026-01-15T10:00:01.482Z",
  "alerts": [ { "id": "27bfd203-...", "alertNumber": 1042, "ruleCode": "IND006-KYC1", "status": "OPEN", "decisionVerdict": "REVIEW", "triggeredAt": "2026-01-15T10:00:01.482Z" } ]
}`;

const TRANSACTION_LIST_EXAMPLE = `# direction / decision / externalCustomerId / dateFrom / dateTo / page / limit are all optional
curl "https://api.protegey.com/partner-api/transactions?externalCustomerId=cust-9981&decision=REVIEW&page=1&limit=20" \\
  -H "x-api-key: YOUR_API_KEY"

# Response — each row omits "alerts" (fetching them for every row on a list this size would be
# an N+1 query per page); call the status endpoint above for one transaction's own alerts.
{
  "data": [
    { "transactionId": "b3b4f28f-...", "externalTransactionId": "tx-00234", "externalCustomerId": "cust-9981", "direction": "DEBIT", "amount": 250000, "currency": "XOF", "decision": "REVIEW", "riskScore": 20, "deviceAction": "ALLOW", "occurredAt": "2026-01-15T10:00:00.000Z", "createdAt": "2026-01-15T10:00:01.482Z" }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}`;

const KYC_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/kyc/sessions \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{ "externalUserId": "cust-9981" }'

# Response — "url" is a one-time link to our FaceTec capture app (protegey-facetec-web),
# not a redirect to a third-party verification page
{ "sessionId": "018f2a3e-...", "url": "https://verify-kyc.protegey.com/?enrollmentId=...&token=...&apiBase=..." }`;

const KYC_POLL_EXAMPLE = `# Polling fallback — see the Webhooks section: delivery is best-effort (one retry, no queue).
curl https://api.protegey.com/partner-api/kyc/sessions/018f2a3e-... \\
  -H "x-api-key: YOUR_API_KEY"

# Response — identical shape to the outbound webhook payload, minus eventId.
# "outcome" mirrors decision.outcome, exposed at the top level for convenience: "SUCCESS" (match
# confidence >= your account's auto-approve threshold, 80% by default), "MANUAL" (passed
# liveness/ID-scan but below that threshold — status is "IN_REVIEW", a human on your side needs
# to decide), or "FAILED" (liveness or ID-scan itself failed). null before a result exists yet.
{ "sessionId": "018f2a3e-...", "externalUserId": "cust-9981", "status": "APPROVED", "outcome": "SUCCESS", "decision": { "source": "facetec", "outcome": "SUCCESS", "passed": true, "confidenceScore": 94, ... } }`;

const KYC_UPDATE_EXAMPLE = `# Correct an OCR misread, or resolve an "IN_REVIEW" session by overriding its status — only the
# fields you send are changed. The original FaceTec signal (decision.outcome) is never
# overwritten; a status override is layered on top as decision.manualReview instead.
curl -X PATCH https://api.protegey.com/partner-api/kyc/sessions/018f2a3e-... \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{ "status": "APPROVED", "reviewNote": "Manually verified against a second document" }'`;

const KYC_RESEND_EXAMPLE = `# Issues a fresh single-use capture link for an enrollment whose previous attempt didn't lead
# anywhere (DECLINED, EXPIRED, or stuck IN_REVIEW) — the customer retries without you having to
# create a whole new enrollment and lose the original record. Sets status to "RESUBMITTED".
curl -X POST https://api.protegey.com/partner-api/kyc/sessions/018f2a3e-.../resend \\
  -H "x-api-key: YOUR_API_KEY"

# Response
{ "sessionId": "018f2a3e-...", "url": "https://verify-kyc.protegey.com/?enrollmentId=...&token=...&apiBase=..." }`;

const KYB_INVITE_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/kyb/applicants \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "contactName": "Awa Diallo",
    "contactEmail": "awa@acme-sarl.com",
    "templateId": "optional-custom-template-id"
  }'

# Response
{ "id": "6e2e6a2e-...", "legalName": null, "contactName": "Awa Diallo", "contactEmail": "awa@acme-sarl.com", "status": "INVITED" }`;

const KYB_LIST_EXAMPLE = `# search / status / stage are all optional filters
curl "https://api.protegey.com/partner-api/kyb/applicants?status=PENDING_REVIEW&stage=RESPONDED" \\
  -H "x-api-key: YOUR_API_KEY"

# Response — status is one of: INVITED, PENDING_REVIEW, MORE_INFO_REQUIRED, ACTIVE, REJECTED
{ "data": [ { "id": "6e2e6a2e-...", "legalName": "Acme SARL", "status": "PENDING_REVIEW", ... } ], "total": 1, "page": 1, "limit": 20 }`;

const KYB_GET_EXAMPLE = `curl https://api.protegey.com/partner-api/kyb/applicants/6e2e6a2e-... \\
  -H "x-api-key: YOUR_API_KEY"`;

const KYB_RESEND_EXAMPLE = `# Issues a fresh invitation link — use when the first one expired or was lost, without
# restarting the applicant's progress.
curl -X POST https://api.protegey.com/partner-api/kyb/applicants/6e2e6a2e-.../resend-invitation \\
  -H "x-api-key: YOUR_API_KEY"`;

const KYB_SCREEN_EXAMPLE = `# Sanctions/PEP screening for the business and each declared owner — the same check that runs
# automatically on submission, re-run on demand.
curl https://api.protegey.com/partner-api/kyb/applicants/6e2e6a2e-.../screen \\
  -H "x-api-key: YOUR_API_KEY"

# Response
{
  "business": { "decision": "CLEAR", "score": 0, "matches": [] },
  "owners": [ { "ownerName": "Awa Diallo", "ownershipPercent": 60, "decision": "CLEAR", "score": 0, "matches": [] } ],
  "screenedAt": "2026-11-13T10:00:00.000Z"
}`;

const SANCTIONS_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/sanctions/screen \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{ "name": "Jane Doe", "type": "person" }'

# Response
{
  "decision": "CLEAR",
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
{ "recorded": true, "action": "ALLOW", "riskScore": 5 }`;

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

# Response — first sessions for a customer come back as "LEARNING" (no score yet)
{ "status": "LEARNING", "deviationScore": 0, "confidenceTier": null, "stepUpRecommended": false, "escalatedAlertId": null }

# Response — once a baseline exists for that customer
{ "status": "SCORED", "deviationScore": 35, "confidenceTier": "MEDIUM", "stepUpRecommended": true, "escalatedAlertId": null }`;

const SHARED_SIGNAL_EXAMPLE = `curl -X POST https://api.protegey.com/partner-api/shared-signal/check \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{ "phoneNumber": "+22890123456", "email": "jane@example.com", "deviceFingerprint": "visitor-id-from-the-sdk", "externalCustomerId": "cust-9981" }'
  # phoneNumber, email and deviceFingerprint are all optional — send whichever you have, any combination

# Response — no match
{ "flagged": false, "category": null, "reportedDaysAgo": null }

# Response — a match (never reveals which partner reported it, or their case details)
{ "flagged": true, "category": "CONFIRMED_FRAUD", "reportedDaysAgo": 12 }`;

const WEBHOOK_HEADERS_EXAMPLE = `POST https://your-endpoint.example.com/webhooks/protegey
Content-Type: application/json
X-Signature: 08fa142f2349cd86b4c4c3a46ce53afe5c63c4a587d7ff3cf52023f201c1526d
X-Timestamp: 1789905404`;

const WEBHOOK_KYC_PAYLOAD_EXAMPLE = `{
  "type": "kyc.status_changed",
  "eventId": "d0d61d39-88c5-4bfb-89eb-08bb1d407c5a",
  "externalUserId": "cust-9981",
  "status": "APPROVED",
  "sessionId": "018f2a3e-...",
  "decision": { "source": "facetec", "outcome": "SUCCESS", "passed": true, "confidenceScore": 94, "livenessScore": 97, "matchScore": 91, ... }
}`;

const WEBHOOK_ALERT_CREATED_EXAMPLE = `{
  "type": "alert.created",
  "eventId": "77cf7610-5380-4b72-aeaf-35645098140c",
  "alertId": "27bfd203-d554-418a-bc19-fcaf13164a0e",
  "ruleCode": "IND006-KYC1",
  "externalCustomerId": "cust-9981",
  "transactionId": "4d06ad4e-2018-428a-8323-d537da5e19fa",
  "status": "OPEN",
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
  "status": "CONFIRMED"
}
// Fires when someone on your team changes an alert's status from the portal — the only way
// you'd otherwise learn of it is polling GET /alerts.`;

const WEBHOOK_TRANSACTION_BLOCKED_EXAMPLE = `{
  "type": "transaction.blocked",
  "eventId": "8a5e6f5a-8b7f-4b51-9df3-2f6c3a1f0c2e",
  "transactionId": "4d06ad4e-2018-428a-8323-d537da5e19fa",
  "externalTransactionId": "tx-9981-004",
  "externalCustomerId": "cust-9981",
  "amount": 400000,
  "currency": "XOF",
  "riskScore": 82,
  "ruleDecision": "REVIEW",
  "deviceAction": "BLOCK",
  "alertIds": ["27bfd203-d554-418a-bc19-fcaf13164a0e"],
  "occurredAt": "2026-09-26T09:12:03.000Z"
}
// Fires whenever a transaction's FINAL decision is "BLOCKED" — whether that came from a rule
// (ruleDecision) or from the device signal (deviceAction), or both. This is the only asynchronous
// signal for a device-only block, since that path never creates an Alert on its own.
// alertIds cross-references any alert.created events also fired for the same transaction.`;

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
  case "transaction.blocked":
    // event.transactionId, event.ruleDecision, event.deviceAction, event.alertIds
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

/** Groups endpoint sections the same way the sidebar itself groups its pages (Pan-ID / Pan-Monitor
 * / Pan-Risk / Intelligence) — this reference reads the same way the product is organized, not by
 * an arbitrary technical taxonomy. */
function ModuleGroup({ id, title, tagline, children }: { id: string; title: string; tagline: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-8 flex flex-col gap-6">
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-bold text-foreground">{title}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <p className="-mt-4 text-center text-xs text-muted-foreground">{tagline}</p>
      {children}
    </div>
  );
}

/** Enum/status reference box — field: value1 | value2 | value3. Field names and enum tokens are
 * API vocabulary, language-agnostic; only the box's own label is translated. */
function ValuesRef({ label, items }: { label: string; items: { field: string; values: string[] }[] }) {
  return (
    <div className="mt-4 rounded-md border border-dashed border-border p-3.5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <dl className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.field} className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <dt className="font-mono font-bold text-foreground">{item.field}:</dt>
            <dd className="font-mono text-muted-foreground">{item.values.join(" | ")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const kycValues = [
  { field: "status", values: ["IN_PROGRESS", "APPROVED", "DECLINED", "IN_REVIEW", "EXPIRED", "RESUBMITTED"] },
  { field: "decision.outcome", values: ["SUCCESS", "MANUAL", "FAILED"] },
];
const kybValues = [
  { field: "status", values: ["INVITED", "PENDING_REVIEW", "MORE_INFO_REQUIRED", "ACTIVE", "REJECTED"] },
  { field: "stage (query filter)", values: ["INVITED", "RESPONDED"] },
  { field: "business.decision / owners[].decision", values: ["CLEAR", "REVIEW", "BLOCKED"] },
];
const transactionValues = [
  { field: "direction", values: ["DEBIT", "CREDIT"] },
  { field: "channel", values: ["BRANCH", "ATM", "POS", "ONLINE", "MOBILE_APP", "USSD", "AGENT", "API", "CALL_CENTER"] },
  { field: "decision", values: ["CLEAR", "REVIEW", "BLOCKED"] },
  { field: "deviceAction", values: ["ALLOW", "SOFT_CHALLENGE", "HARD_CHALLENGE", "BLOCK"] },
];
const sanctionsValues = [
  { field: "decision", values: ["CLEAR", "REVIEW", "BLOCKED"] },
  { field: "score", values: ["0.0", "–", "1.0 (similarity ratio, not a percentage)"] },
];
const deviceValues = [{ field: "action", values: ["ALLOW", "SOFT_CHALLENGE", "HARD_CHALLENGE", "BLOCK"] }];
const behavioralValues = [
  { field: "status", values: ["LEARNING", "SCORED"] },
  { field: "confidenceTier", values: ["null (while learning)", "LOW", "MEDIUM", "HIGH"] },
];
const sharedSignalValues = [{ field: "category", values: ["CONFIRMED_FRAUD", "IDENTITY_THEFT", "MONEY_LAUNDERING", "OTHER"] }];

export default async function DocumentationPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_integrations", lang);
  if (denied) return denied;

  const nav = [
    { id: "auth", label: t(lang, "docsNavAuth") },
    { id: "sdks", label: t(lang, "docsNavSdks") },
    { id: "group-pan-id", label: t(lang, "navPanId"), isGroup: true },
    { id: "kyc", label: t(lang, "docsNavKyc") },
    { id: "kyb", label: t(lang, "docsNavKyb") },
    { id: "group-pan-monitor", label: t(lang, "navPanMonitor"), isGroup: true },
    { id: "transactions", label: t(lang, "docsNavTransactions") },
    { id: "group-pan-risk", label: t(lang, "navPanRisk"), isGroup: true },
    { id: "sanctions", label: t(lang, "docsNavSanctions") },
    { id: "group-pan-intel", label: t(lang, "navIntelligence"), isGroup: true },
    { id: "device-events", label: t(lang, "docsNavDeviceEvents") },
    { id: "behavioral-events", label: t(lang, "docsNavBehavioralEvents") },
    { id: "shared-signal", label: t(lang, "docsNavSharedSignal") },
    { id: "webhooks", label: t(lang, "docsNavWebhooks") },
    { id: "errors", label: t(lang, "docsNavErrors") },
  ];

  return (
    <div className="mx-auto flex max-w-5xl gap-8">
      <nav className="sticky top-8 hidden h-fit w-48 shrink-0 flex-col gap-1 lg:flex">
        {nav.map((item) =>
          item.isGroup ? (
            <div key={item.id} className="mt-3 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 first:mt-0">
              {item.label}
            </div>
          ) : (
            <a key={item.id} href={`#${item.id}`} className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {item.label}
            </a>
          ),
        )}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{t(lang, "docsPageTitle")}</h1>
            <PageGuideButton content={DOCUMENTATION_GUIDE[lang]} />
          </div>
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
              href="/sdks/react-native"
              className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(lang, "navSdkReactNative")}
            </Link>
            <Link
              href="/sdks/flutter"
              className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(lang, "navSdkFlutter")}
            </Link>
            <Link
              href="/sdks/php"
              className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(lang, "navSdkPhp")}
            </Link>
            <Link
              href="/sdks/java"
              className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(lang, "navSdkJava")}
            </Link>
            <Link
              href="/sdks/dotnet"
              className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(lang, "navSdkDotnet")}
            </Link>
          </div>
        </Section>

        <ModuleGroup id="group-pan-id" title={t(lang, "navPanId")} tagline={t(lang, "docsGroupPanIdTagline")}>
        <Section id="kyc" icon={IdCard} title={t(lang, "docsKycTitle")} body={t(lang, "docsKycBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={KYC_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKycPollLabel")}</p>
          <CodeBlock code={KYC_POLL_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsKycPollNote")}</p>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKycUpdateLabel")}</p>
          <CodeBlock code={KYC_UPDATE_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKycResendLabel")}</p>
          <CodeBlock code={KYC_RESEND_EXAMPLE} />
          <ValuesRef label={t(lang, "docsValuesLabel")} items={kycValues} />
          <div className="mt-4">
            <p className="mb-1.5 text-xs text-amber-600">{t(lang, "docsKycConsoleRealWarning")}</p>
            <ApiConsole
              method="POST"
              path="/partner-api/kyc/sessions"
              fields={[{ name: "externalUserId", label: "externalUserId", type: "text", required: true, placeholder: "cust-0001" }]}
            />
          </div>
        </Section>

        <Section id="kyb" icon={Building2} title={t(lang, "docsKybTitle")} body={t(lang, "docsKybBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKybInviteLabel")}</p>
          <CodeBlock code={KYB_INVITE_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKybListLabel")}</p>
          <CodeBlock code={KYB_LIST_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKybGetLabel")}</p>
          <CodeBlock code={KYB_GET_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKybResendLabel")}</p>
          <CodeBlock code={KYB_RESEND_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsKybScreenLabel")}</p>
          <CodeBlock code={KYB_SCREEN_EXAMPLE} />
          <ValuesRef label={t(lang, "docsValuesLabel")} items={kybValues} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsKybScopeNote")}</p>
          <div className="mt-4">
            <ApiConsole
              method="POST"
              path="/partner-api/kyb/applicants"
              fields={[
                { name: "contactName", label: "contactName", type: "text", required: true, placeholder: "Awa Diallo" },
                { name: "contactEmail", label: "contactEmail", type: "text", required: true, placeholder: "awa@acme-sarl.com" },
              ]}
            />
          </div>
        </Section>
        </ModuleGroup>

        <ModuleGroup id="group-pan-monitor" title={t(lang, "navPanMonitor")} tagline={t(lang, "docsGroupPanMonitorTagline")}>
        <Section id="transactions" icon={ArrowRightLeft} title={t(lang, "docsTransactionsTitle")} body={t(lang, "docsTransactionsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={TRANSACTION_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsSeeAlsoRules")}</p>
          <div className="mt-4">
            <ApiConsole
              method="POST"
              path="/partner-api/transactions"
              fields={[
                { name: "externalTransactionId", label: "externalTransactionId", type: "text", required: true, placeholder: "tx-0001" },
                { name: "externalCustomerId", label: "externalCustomerId", type: "text", required: true, placeholder: "cust-0001" },
                { name: "direction", label: "direction", type: "select", options: ["CREDIT", "DEBIT"], defaultValue: "DEBIT" },
                { name: "amount", label: "amount", type: "number", required: true, placeholder: "50000" },
                { name: "currency", label: "currency", type: "text", defaultValue: "XOF" },
                { name: "transactionType", label: "transactionType", type: "text", required: true, placeholder: "TRANSFER" },
                { name: "isCash", label: "isCash", type: "boolean", defaultValue: false },
                {
                  name: "channel",
                  label: "channel",
                  type: "select",
                  options: ["BRANCH", "ATM", "POS", "ONLINE", "MOBILE_APP", "USSD", "AGENT", "API", "CALL_CENTER"],
                },
                { name: "counterpartyInstitutionCode", label: "counterpartyInstitutionCode", type: "text", placeholder: "SWIFT/BIC or local bank code" },
                { name: "counterpartyCountry", label: "counterpartyCountry", type: "text", placeholder: "SN" },
                { name: "occurredAt", label: "occurredAt", type: "text", required: true, defaultValue: new Date().toISOString() },
              ]}
            />
          </div>
          <p className="mt-6 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsTransactionsStatusLabel")}</p>
          <CodeBlock code={TRANSACTION_STATUS_EXAMPLE} />
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsTransactionsListLabel")}</p>
          <CodeBlock code={TRANSACTION_LIST_EXAMPLE} />
          <ValuesRef label={t(lang, "docsValuesLabel")} items={transactionValues} />
          <p className="mt-6 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsSequenceTitle")}</p>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t(lang, "docsSequenceBody")}</p>
          <Link
            href="/decision-flow"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {t(lang, "navDecisionFlow")}
            <ArrowRightLeft className="size-3.5" />
          </Link>
        </Section>
        </ModuleGroup>

        <ModuleGroup id="group-pan-risk" title={t(lang, "navPanRisk")} tagline={t(lang, "docsGroupPanRiskTagline")}>
        <Section id="sanctions" icon={ShieldCheck} title={t(lang, "docsSanctionsTitle")} body={t(lang, "docsSanctionsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={SANCTIONS_EXAMPLE} />
          <ValuesRef label={t(lang, "docsValuesLabel")} items={sanctionsValues} />
          <div className="mt-4">
            <ApiConsole
              method="POST"
              path="/partner-api/sanctions/screen"
              fields={[{ name: "name", label: "name", type: "text", required: true, placeholder: "Aïssata Bamba" }]}
            />
          </div>
        </Section>
        </ModuleGroup>

        <ModuleGroup id="group-pan-intel" title={t(lang, "navIntelligence")} tagline={t(lang, "docsGroupPanIntelTagline")}>
        <Section id="device-events" icon={Smartphone} title={t(lang, "docsDeviceEventsTitle")} body={t(lang, "docsDeviceEventsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={DEVICE_EVENT_EXAMPLE} />
          <ValuesRef label={t(lang, "docsValuesLabel")} items={deviceValues} />
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/pan-guard/device-signals" className="text-primary hover:underline">
              {t(lang, "docsSeeAlsoDeviceSignals")}
            </Link>
          </p>
          <div className="mt-4">
            <ApiConsole
              method="POST"
              path="/partner-api/device-events"
              fields={[
                { name: "eventId", label: "eventId", type: "text", required: true, placeholder: "evt-0001" },
                { name: "externalCustomerId", label: "externalCustomerId", type: "text", placeholder: "cust-0001" },
                { name: "visitorId", label: "visitorId", type: "text", placeholder: "visitor-id-from-the-sdk" },
              ]}
            />
          </div>
        </Section>

        <Section id="behavioral-events" icon={Activity} title={t(lang, "docsBehavioralEventsTitle")} body={t(lang, "docsBehavioralEventsBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={BEHAVIORAL_EVENT_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsBehavioralEventsStepUpNote")}</p>
          <ValuesRef label={t(lang, "docsValuesLabel")} items={behavioralValues} />
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/pan-guard/behavioral-signals" className="text-primary hover:underline">
              {t(lang, "docsSeeAlsoBehavioralSignals")}
            </Link>
          </p>
          <div className="mt-4">
            <p className="mb-1.5 text-xs text-muted-foreground">{t(lang, "docsBehavioralEventsConsoleNote")}</p>
            <ApiConsole
              method="POST"
              path="/partner-api/behavioral-events"
              fields={[
                { name: "externalCustomerId", label: "externalCustomerId", type: "text", required: true, placeholder: "cust-0001" },
                { name: "sessionId", label: "sessionId", type: "text", required: true, placeholder: "session-0001" },
              ]}
            />
          </div>
        </Section>

        <Section id="shared-signal" icon={Share2} title={t(lang, "docsSharedSignalTitle")} body={t(lang, "docsSharedSignalBody")}>
          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "igCodeExampleTitle")}</p>
          <CodeBlock code={SHARED_SIGNAL_EXAMPLE} />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "docsSharedSignalOptInNote")}</p>
          <ValuesRef label={t(lang, "docsValuesLabel")} items={sharedSignalValues} />
          <div className="mt-4">
            <ApiConsole
              method="POST"
              path="/partner-api/shared-signal/check"
              fields={[
                { name: "phoneNumber", label: "phoneNumber", type: "text", placeholder: "+22890123456" },
                { name: "email", label: "email", type: "text", placeholder: "jane@example.com" },
                { name: "deviceFingerprint", label: "deviceFingerprint", type: "text", placeholder: "visitor-id-from-the-sdk" },
              ]}
            />
          </div>
        </Section>
        </ModuleGroup>

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
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">transaction.blocked</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksTransactionBlockedTrigger")}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t(lang, "docsWebhooksMoreTypesNote")}</p>

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsWebhooksHeadersExampleTitle")}</p>
          <CodeBlock code={WEBHOOK_HEADERS_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">kyc.status_changed</p>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {t(lang, "docsWebhooksKycStatusValuesLabel")}: In Progress, Approved, Declined, In Review, Expired, Resubmitted.
          </p>
          <p className="mb-1.5 text-xs text-muted-foreground">{t(lang, "docsWebhooksKycStatusLegacyNote")}</p>
          <p className="mb-1.5 text-xs text-muted-foreground">{t(lang, "docsWebhooksKycOutcomeNote")}</p>
          <CodeBlock code={WEBHOOK_KYC_PAYLOAD_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">alert.created</p>
          <CodeBlock code={WEBHOOK_ALERT_CREATED_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">alert.status_changed</p>
          <CodeBlock code={WEBHOOK_ALERT_STATUS_EXAMPLE} />

          <p className="mt-4 mb-1.5 text-xs font-semibold uppercase text-muted-foreground">transaction.blocked</p>
          <CodeBlock code={WEBHOOK_TRANSACTION_BLOCKED_EXAMPLE} />

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
