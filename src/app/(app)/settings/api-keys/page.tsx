import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getSessionUser } from "@/lib/session";
import { getApiKeySummary } from "./actions";
import { ApiKeyCard } from "./ApiKeyCard";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const API_KEYS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Clés API",
    explanation:
      "Cette clé, c'est comment TON backend s'authentifie AUPRÈS de Protegey — tu l'envoies dans l'en-tête `x-api-key` de chaque appel (envoyer une transaction, démarrer un KYC, faire une recherche de sanctions…). C'est l'inverse des Webhooks : les webhooks sont Protegey qui t'appelle, la clé API c'est toi qui appelles Protegey.\n\nSi tu régénères la clé, l'ancienne cesse immédiatement de fonctionner — pense à mettre à jour ton backend en même temps pour ne pas casser ton intégration.",
  },
  en: {
    title: "API keys",
    explanation:
      "This key is how YOUR backend authenticates TO Protegey — you send it in the `x-api-key` header of every call (sending a transaction, starting a KYC, running a sanctions search…). It's the mirror image of Webhooks: webhooks are Protegey calling you, the API key is you calling Protegey.\n\nIf you regenerate the key, the old one stops working immediately — update your backend at the same time so you don't break your integration.",
  },
};

export const metadata: Metadata = {
  title: "API Keys — Protegey Partner",
};

export default async function ApiKeysPage() {
  const [user, credentials, lang] = await Promise.all([getSessionUser(), getApiKeySummary(), getLang()]);
  const canManageSettings = user?.permissions.includes("partners.manage_settings") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "navApiKeys")}</h1>
          <PageGuideButton content={API_KEYS_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "settingsApiAccessDescription")}</p>
      </div>

      <ApiKeyCard credentials={credentials} canManage={canManageSettings} />
    </div>
  );
}
