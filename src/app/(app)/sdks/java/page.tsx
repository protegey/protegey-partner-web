import Link from "next/link";
import { Package, Rocket, ArrowRightLeft, IdCard, ShieldCheck, ShieldAlert } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { CodeBlock } from "@/components/CodeBlock";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

const SDK_JAVA_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "SDK Java",
    explanation:
      "Le paquet `protegey-sdk` est back-end uniquement — pensé pour tourner sur ton serveur Java (Spring Boot ou autre), jamais dans un navigateur. Il couvre les transactions, la vérification d'identité, et la vérification de signature des webhooks entrants via `WebhookVerifier`. Construit sur `java.net.http.HttpClient` (JDK 11+), Gson comme seule dépendance.\n\nPas d'intelligence d'appareil ni de biométrie comportementale ici — ce sont des concepts navigateur/mobile, couverts par les SDK JavaScript, React Native ou Flutter.\n\nCette page ne montre aucune donnée de ton compte — c'est une référence technique avec des exemples de code à copier-coller.",
  },
  en: {
    title: "Java SDK",
    explanation:
      "The `protegey-sdk` package is backend-only — meant to run on your Java server (Spring Boot or otherwise), never in a browser. It covers transactions, identity verification, and verifying incoming webhook signatures via `WebhookVerifier`. Built on `java.net.http.HttpClient` (JDK 11+), with Gson as its only dependency.\n\nNo device intelligence or behavioral biometrics here — those are browser/mobile concepts, covered by the JavaScript, React Native, or Flutter SDKs.\n\nThis page shows none of your account's data — it's a technical reference with copy-paste code examples.",
  },
};

const INSTALL_GITHUB = `# Not yet on Maven Central — install into your local ~/.m2 first:
git clone https://github.com/protegey/protegey_java_sdk.git
cd protegey_java_sdk && mvn install`;

const INIT = `import com.protegey.sdk.Protegey;

// baseUrl has no default on purpose — confirm the current value with Protegey, it can
// change independently of this package (e.g. between staging and production).
Protegey protegey = new Protegey("YOUR_API_KEY", "https://api.protegey.com");`;

const TRANSACTIONS_EXAMPLE = `Map<String, Object> result = protegey.transactions.report(Map.of(
    "externalTransactionId", "tx-00234",
    "externalCustomerId", "cust-9981",
    "direction", "DEBIT",
    "amount", 250000,
    "currency", "XOF",
    "transactionType", "cashout",
    "isCash", true
));
// result.get("decision"): "clear" | "review" | "blocked" — result.get("alerts") lists any rule that matched.`;

const KYC_START_EXAMPLE = `// Starts the session and hands back the link — no manual API call needed
Map<String, Object> session = protegey.kyc.startSession("cust-9981");
// Send session.get("url") to your user however you like (SMS, email, your own hosted redirect page).`;

const KYC_POLL_EXAMPLE = `// Polling fallback — webhook delivery is best-effort (one retry, no queue), so use this
// if you're not sure a delivery ever arrived, or just want to double-check a session's status.
Map<String, Object> current = protegey.kyc.getSession((String) session.get("sessionId"));
// current.get("status") is the same value the webhook would have sent (e.g. "Approved", "Declined", "In Review", ...).`;

const WEBHOOK_VERIFY_EXAMPLE = `import com.protegey.sdk.WebhookVerifier;

String payload = rawRequestBody; // the RAW body — do not re-encode/re-serialize it
String timestamp = request.getHeader("X-Timestamp");
String signature = request.getHeader("X-Signature");

if (!WebhookVerifier.verify(payload, timestamp, signature, yourWebhookSecret)) {
    response.setStatus(401);
    return;
}`;

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

export default async function SdkJavaPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_integrations", lang);
  if (denied) return denied;

  const nav = [
    { id: "install", label: t(lang, "docsSdksInstallLabel") },
    { id: "transactions", label: t(lang, "docsSdksCapabilityTransactions") },
    { id: "kyc", label: t(lang, "docsSdksCapabilityKyc") },
    { id: "webhooks", label: t(lang, "docsSdksCapabilityWebhookVerify") },
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
            <h1 className="text-xl font-semibold text-foreground">{t(lang, "sdkJavaPageTitle")}</h1>
            <PageGuideButton content={SDK_JAVA_GUIDE[lang]} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t(lang, "sdkJavaPageSubtitle")}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a
              href="https://github.com/protegey/protegey_java_sdk"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-primary hover:underline"
            >
              {t(lang, "docsSdksSourceLink")}
            </a>
            <a
              href="https://github.com/protegey/protegey_example_java_springboot"
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

        <Section id="transactions" icon={ArrowRightLeft} title={t(lang, "docsSdksCapabilityTransactions")} body={t(lang, "sdkTransactionsBody")}>
          <CodeBlock code={TRANSACTIONS_EXAMPLE} className="mt-4" />
        </Section>

        <Section id="kyc" icon={IdCard} title={t(lang, "docsSdksCapabilityKyc")} body={t(lang, "sdkKycBody")}>
          <CodeBlock code={KYC_START_EXAMPLE} className="mt-4" />
          <CodeBlock code={KYC_POLL_EXAMPLE} className="mt-2" />
        </Section>

        <Section id="webhooks" icon={ShieldCheck} title={t(lang, "docsSdksCapabilityWebhookVerify")} body={t(lang, "sdkWebhookVerifyBody")}>
          <CodeBlock code={WEBHOOK_VERIFY_EXAMPLE} className="mt-4" />
          <p className="mt-3 text-xs text-muted-foreground">
            <Link href="/documentation#webhooks" className="text-primary hover:underline">
              {t(lang, "docsNavWebhooks")}
            </Link>
          </p>
        </Section>

        <Section id="security" icon={ShieldAlert} title={t(lang, "sdkSecurityTitle")} body={t(lang, "sdkSecurityBodyBackend")} />

        <p className="text-xs text-muted-foreground">
          <Link href="/documentation" className="text-primary hover:underline">
            {t(lang, "sdkSeeAlsoApiDocs")}
          </Link>
        </p>
      </div>
    </div>
  );
}
