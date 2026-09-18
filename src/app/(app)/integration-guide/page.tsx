import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Integration Guide — Protegey Partner",
};

export default async function IntegrationGuidePage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const canManage = user?.permissions.includes("partners.manage_clients") ?? false;
  void canManage;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "igPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "igPageSubtitle")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "igAuthTitle")}</p>
        <p className="text-xs text-muted-foreground">
          {t(lang, "igAuthBodyPrefix")} <a href="/settings" className="text-primary hover:text-primary/90">{t(lang, "settingsPageTitle")}</a>
          {" "}{t(lang, "igAuthBodySuffix")}
        </p>

        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "igWorkflowTitle")}</p>
        <ol className="list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>{t(lang, "igStepInviteLabel")}</strong> {t(lang, "igStepInvitePrefix")} <code>/clients/me</code> {t(lang, "igStepInviteMiddle")} <code>contactName</code> {t(lang, "igStepInviteSuffix")} <code>contactEmail</code>.
          </li>
          <li>
            <strong>{t(lang, "igStepFormLabel")}</strong> {t(lang, "igStepFormPrefix")} <code>/client-application/:token</code>.
          </li>
          <li>
            <strong>{t(lang, "igStepScreeningLabel")}</strong> {t(lang, "igStepScreeningBody")}
          </li>
          <li>
            <strong>{t(lang, "igStepConsultLabel")}</strong> {t(lang, "igStepConsultPrefix")} <code>/clients/:clientId</code> {t(lang, "igStepConsultMiddle")} <strong>{t(lang, "igComplianceInfoLabel")}</strong>.
          </li>
        </ol>

        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "igWebhookTitle")}</p>
        <p className="text-xs text-muted-foreground">
          {t(lang, "igWebhookPrefix")} <code>/settings</code> {t(lang, "igWebhookSuffix")} <code>pending_review</code> {t(lang, "igWebhookMiddle")} <code>active</code>).
        </p>

        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "igEndpointsTitle")}</p>
        <ul className="list-disc text-sm text-muted-foreground space-y-1">
          <li><strong>GET /partners/me</strong>: {t(lang, "igEndpointPartnerProfile")}</li>
          <li><code>GET /partners/me/api-credentials</code>: {t(lang, "igEndpointApiCredGet")}</li>
          <li><code>POST /partners/me/api-credentials</code>: {t(lang, "igEndpointApiCredPost")}</li>
          <li><code>PATCH /partners/me/api-credentials/webhook</code>: {t(lang, "igEndpointWebhookPatch")}</li>
          <li><code>GET /clients/me</code>: {t(lang, "igEndpointClientsList")}</li>
          <li><code>GET /clients/:clientId</code>: {t(lang, "igEndpointClientDetail")}</li>
          <li><code>GET /clients/:clientId/screen</code>: {t(lang, "igEndpointClientScreen")}</li>
        </ul>
      </div>
    </div>
  );
}
