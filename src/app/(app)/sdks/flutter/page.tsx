import type { Metadata } from "next";
import Link from "next/link";
import { Package, Rocket, Smartphone, ArrowRightLeft, IdCard, Activity, ShieldAlert } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Flutter SDK — Protegey Partner",
};

const INSTALL_GITHUB = `# pubspec.yaml
dependencies:
  protegey_sdk:
    git:
      url: https://github.com/protegey/protegey_flutter_sdk.git
      ref: main`;

const INSTALL_PUBDEV = `flutter pub add protegey_sdk`;

const INIT = `// baseUrl has no default on purpose — confirm the current value with Protegey, it can
// change independently of this package (e.g. between staging and production).
final protegey = Protegey(apiKey: 'YOUR_API_KEY', baseUrl: 'https://api.protegey.com');`;

const DEVICE_EXAMPLE = `// Computes a real, stable per-device fingerprint on Android/iOS via device_info_plus.
final identify = await protegey.device.identify(
  externalCustomerId: 'cust-9981',
  phoneNumber: '+22890000001', // optional — you already have it, never read off the device
);
// identify.action is a recommendation only (allow / soft_challenge / hard_challenge / block) —
// Protegey never blocks your user itself, your app decides what to do with it.`;

const DEVICE_OUTSIDE_ANDROID_IOS = `// On any other platform (desktop, unsupported) there's no reliable stable id available
// through device_info_plus. Pass your own via visitorId if you need one:
final identify = await protegey.device.identify(
  visitorId: myStoredDeviceId,
  externalCustomerId: 'cust-9981',
);`;

const TRANSACTIONS_EXAMPLE = `final result = await protegey.transactions.report(TransactionInput(
  externalTransactionId: 'tx-00234',
  externalCustomerId: 'cust-9981',
  direction: TransactionDirection.debit,
  amount: 250000,
  currency: 'XOF',
  transactionType: 'cashout',
  isCash: true,
  visitorId: identify.visitorId, // fold the device signal above into this transaction's decision
));
// result.decision: 'clear' | 'review' | 'blocked' — result.alerts lists any rule that matched.`;

const KYC_START_EXAMPLE = `// Starts the session and hands back the link — no manual API call needed
final session = await protegey.kyc.startSession(externalUserId: 'cust-9981');
// Send session.url to your user however you like (SMS, email, in-app webview).`;

const KYC_POLL_EXAMPLE = `// Polling fallback — webhook delivery is best-effort (one retry, no queue), so use this
// if you're not sure a delivery ever arrived, or just want to double-check a session's status.
final current = await protegey.kyc.getSession(session.sessionId);
// current.status is the same value the webhook would have sent (e.g. 'Approved', 'Declined', 'In Review', ...).`;

const BEHAVIORAL_EXAMPLE = `// Aggregated keystroke/touch/navigation metadata only — never raw content.
final behavioral = await protegey.behavioral.report(ReportBehavioralEventInput(
  externalCustomerId: 'cust-9981',
  sessionId: 'sess-20260115-01',
  keystroke: const KeystrokeMetrics(avgInterKeyLatencyMs: 145, typingSpeedCharsPerSec: 4.2, errorRate: 0.02),
  touch: const TouchMetrics(avgSwipeVelocity: 22, scrollBehaviorScore: 0.8),
  navigation: const NavigationMetrics(screenSequence: ['login', 'dashboard', 'transfer', 'confirm']),
));
// behavioral.status == 'learning' for a customer's first few sessions — expected, not an error.
// Once scored: behavioral.stepUpRecommended tells you whether to challenge this user (OTP, biometric, ...).`;

function Section({
  id,
  icon: Icon,
  title,
  body,
  children,
}: {
  id: string;
  icon: typeof Package;
  title: string;
  body?: string;
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
      {body ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p> : null}
      {children}
    </section>
  );
}

export default async function SdkFlutterPage() {
  const lang = await getLang();

  const nav = [
    { id: "install", label: t(lang, "docsSdksInstallLabel") },
    { id: "device", label: t(lang, "docsSdksCapabilityDevice") },
    { id: "transactions", label: t(lang, "docsSdksCapabilityTransactions") },
    { id: "kyc", label: t(lang, "docsSdksCapabilityKyc") },
    { id: "behavioral", label: t(lang, "docsNavBehavioralEvents") },
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
          <div className="flex items-center gap-2.5">
            <Package className="size-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">{t(lang, "sdkFlutterPageTitle")}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t(lang, "sdkFlutterPageSubtitle")}</p>
          <a
            href="https://github.com/protegey/protegey_flutter_sdk"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            {t(lang, "docsSdksSourceLink")}
          </a>
        </div>

        <Section id="install" icon={Rocket} title={t(lang, "docsSdksInstallLabel")}>
          <p className="mt-3 text-xs font-medium text-foreground">{t(lang, "docsSdksInstallGithub")}</p>
          <CodeBlock code={INSTALL_GITHUB} className="mt-1.5" />
          <p className="mt-2 text-xs font-medium text-muted-foreground">{t(lang, "docsSdksInstallFuture")}</p>
          <CodeBlock code={INSTALL_PUBDEV} className="mt-1.5 opacity-60" />
          <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsSdksInitLabel")}</p>
          <CodeBlock code={INIT} className="mt-1.5" />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "sdkBaseUrlNote")}</p>
        </Section>

        <Section id="device" icon={Smartphone} title={t(lang, "docsSdksCapabilityDevice")} body={t(lang, "sdkDeviceBodyFlutter")}>
          <CodeBlock code={DEVICE_EXAMPLE} className="mt-4" />
          <p className="mt-3 text-xs font-medium text-muted-foreground">{t(lang, "sdkDeviceOtherPlatformLabel")}</p>
          <CodeBlock code={DEVICE_OUTSIDE_ANDROID_IOS} className="mt-1.5" />
        </Section>

        <Section id="transactions" icon={ArrowRightLeft} title={t(lang, "docsSdksCapabilityTransactions")} body={t(lang, "sdkTransactionsBody")}>
          <CodeBlock code={TRANSACTIONS_EXAMPLE} className="mt-4" />
        </Section>

        <Section id="kyc" icon={IdCard} title={t(lang, "docsSdksCapabilityKyc")} body={t(lang, "sdkKycBody")}>
          <CodeBlock code={KYC_START_EXAMPLE} className="mt-4" />
          <CodeBlock code={KYC_POLL_EXAMPLE} className="mt-2" />
          <p className="mt-3 text-xs text-muted-foreground">
            {t(lang, "sdkKycWebhookNote")}{" "}
            <Link href="/documentation#webhooks" className="text-primary hover:underline">
              {t(lang, "docsNavWebhooks")}
            </Link>
          </p>
        </Section>

        <Section id="behavioral" icon={Activity} title={t(lang, "docsNavBehavioralEvents")} body={t(lang, "sdkBehavioralBody")}>
          <CodeBlock code={BEHAVIORAL_EXAMPLE} className="mt-4" />
        </Section>

        <Section id="security" icon={ShieldAlert} title={t(lang, "sdkSecurityTitle")} body={t(lang, "sdkSecurityBody")} />

        <p className="text-xs text-muted-foreground">
          <Link href="/documentation" className="text-primary hover:underline">
            {t(lang, "sdkSeeAlsoApiDocs")}
          </Link>
        </p>
      </div>
    </div>
  );
}
