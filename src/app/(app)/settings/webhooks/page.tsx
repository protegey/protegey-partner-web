import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getSessionUser } from "@/lib/session";
import { getWebhookSummary } from "./actions";
import { WebhookCard } from "./WebhookCard";

export const metadata: Metadata = {
  title: "Webhooks — Protegey Partner",
};

export default async function WebhooksPage() {
  const [user, credentials, lang] = await Promise.all([getSessionUser(), getWebhookSummary(), getLang()]);
  const canManageSettings = user?.permissions.includes("partners.manage_settings") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "navWebhooks")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "settingsWebhookDescription")}</p>
      </div>

      <WebhookCard credentials={credentials} canManage={canManageSettings} />
    </div>
  );
}
