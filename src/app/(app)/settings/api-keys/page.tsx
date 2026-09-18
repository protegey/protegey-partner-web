import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getSessionUser } from "@/lib/session";
import { getApiKeySummary } from "./actions";
import { ApiKeyCard } from "./ApiKeyCard";

export const metadata: Metadata = {
  title: "API Keys — Protegey Partner",
};

export default async function ApiKeysPage() {
  const [user, credentials, lang] = await Promise.all([getSessionUser(), getApiKeySummary(), getLang()]);
  const canManageSettings = user?.permissions.includes("partners.manage_settings") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "navApiKeys")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "settingsApiAccessDescription")}</p>
      </div>

      <ApiKeyCard credentials={credentials} canManage={canManageSettings} />
    </div>
  );
}
