import Link from "next/link";
import { Package, Rocket, Smartphone, ArrowRightLeft, IdCard, Activity, ShieldAlert } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { CodeBlock } from "@/components/CodeBlock";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

const SDK_RN_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "SDK React Native",
    explanation:
      "Le paquet `@protegey/react-native-sdk` apporte l'intelligence d'appareil et la biométrie comportementale directement depuis l'app, et ajoute un écran de vérification d'identité intégré : `ProtegeyKycProvider` + `useProtegeyKyc()`. Un seul appel démarre la session et l'affiche dans un panneau coulissant — ton utilisateur ne quitte jamais l'app.\n\nCette page ne montre aucune donnée de ton compte — c'est une référence technique avec des exemples de code à copier-coller.",
  },
  en: {
    title: "React Native SDK",
    explanation:
      "The `@protegey/react-native-sdk` package brings device intelligence and behavioral biometrics directly from the app, and adds an in-app identity-verification screen: `ProtegeyKycProvider` + `useProtegeyKyc()`. One call starts the session and shows it in a draggable sheet — your user never leaves the app.\n\nThis page shows none of your account's data — it's a technical reference with copy-paste code examples.",
  },
};

const INSTALL_GITHUB = `npm install git+https://github.com/protegey/protegey_react_native_sdk.git react-native-webview`;

const INIT = `import { Protegey, ProtegeyKycProvider, useProtegeyKyc } from "@protegey/react-native-sdk";

// baseUrl has no default on purpose — confirm the current value with Protegey, it can
// change independently of this package (e.g. between staging and production).
const protegey = new Protegey({ apiKey: "YOUR_API_KEY", baseUrl: "https://api.protegey.com" });

// Wrap your app once, near the root.
export default function App() {
  return (
    <ProtegeyKycProvider>
      <Home />
    </ProtegeyKycProvider>
  );
}`;

const DEVICE_EXAMPLE = `// Call on login/session start.
const { visitorId, action, riskScore } = await protegey.device.identify({
  externalCustomerId: "cust-9981",
  phoneNumber: "+22890000001", // optional — you already have it, we never read it off the device
});
// action is a recommendation only ("allow" | "soft_challenge" | "hard_challenge" | "block") —
// Protegey never blocks your user itself, your app decides what to do with it.`;

const DEVICE_NO_DOM = `// There's no DOM in React Native, so identify() falls back to a fresh random id on every
// call. Pass your own stable id if you have one (e.g. one you persist with AsyncStorage):
await protegey.device.identify({ visitorId: myStoredDeviceId, externalCustomerId: "cust-9981" });`;

const KYC_PRESENT_EXAMPLE = `function Home() {
  const { present } = useProtegeyKyc();

  async function verifyIdentity() {
    const status = await present(protegey.kyc, { externalUserId: "cust-9981" });
    // status?.status — e.g. "Approved", "Declined", "In Review" — or undefined if the user
    // closed the sheet before one arrived.
  }
}`;

const BEHAVIORAL_EXAMPLE = `// Aggregated keystroke/touch/navigation metadata only — never raw content.
const behavioral = await protegey.behavioral.report({
  externalCustomerId: "cust-9981",
  sessionId: "sess-20260115-01",
  keystroke: { avgInterKeyLatencyMs: 145, typingSpeedCharsPerSec: 4.2, errorRate: 0.02 },
  touch: { avgSwipeVelocity: 22, scrollBehaviorScore: 0.8 },
  navigation: { screenSequence: ["login", "dashboard", "transfer", "confirm"] },
});
// behavioral.status === "learning" for a customer's first few sessions — expected, not an error.
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

export default async function SdkReactNativePage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_integrations", lang);
  if (denied) return denied;

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
            <h1 className="text-xl font-semibold text-foreground">{t(lang, "sdkReactNativePageTitle")}</h1>
            <PageGuideButton content={SDK_RN_GUIDE[lang]} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t(lang, "sdkReactNativePageSubtitle")}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a
              href="https://github.com/protegey/protegey_react_native_sdk"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-primary hover:underline"
            >
              {t(lang, "docsSdksSourceLink")}
            </a>
            <a
              href="https://github.com/protegey/protegey_example_react_native"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-primary hover:underline"
            >
              {t(lang, "sdkExampleLink")}
            </a>
          </div>
        </div>

        <Section id="install" icon={Rocket} title={t(lang, "docsSdksInstallLabel")}>
          <p className="mt-3 text-xs font-medium text-foreground">{t(lang, "docsSdksInstallGithub")}</p>
          <CodeBlock code={INSTALL_GITHUB} className="mt-1.5" />
          <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{t(lang, "docsSdksInitLabel")}</p>
          <CodeBlock code={INIT} className="mt-1.5" />
          <p className="mt-3 text-xs text-muted-foreground">{t(lang, "sdkBaseUrlNote")}</p>
        </Section>

        <Section id="device" icon={Smartphone} title={t(lang, "docsSdksCapabilityDevice")} body={t(lang, "sdkDeviceBody")}>
          <CodeBlock code={DEVICE_EXAMPLE} className="mt-4" />
          <p className="mt-3 text-xs font-medium text-muted-foreground">{t(lang, "sdkDeviceOtherPlatformLabel")}</p>
          <CodeBlock code={DEVICE_NO_DOM} className="mt-1.5" />
        </Section>

        <Section id="transactions" icon={ArrowRightLeft} title={t(lang, "docsSdksCapabilityTransactions")} body={t(lang, "sdkTransactionsBodyMobile")}>
          <p className="mt-4 text-xs font-medium text-muted-foreground">{t(lang, "sdkTransactionsMobileSeeAlso")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/sdks/js" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
              {t(lang, "navSdkJs")}
            </Link>
            <Link href="/sdks/php" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
              {t(lang, "navSdkPhp")}
            </Link>
            <Link href="/sdks/java" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
              {t(lang, "navSdkJava")}
            </Link>
          </div>
        </Section>

        <Section id="kyc" icon={IdCard} title={t(lang, "docsSdksCapabilityKyc")} body={t(lang, "sdkKycInAppBody")}>
          <CodeBlock code={KYC_PRESENT_EXAMPLE} className="mt-4" />
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
