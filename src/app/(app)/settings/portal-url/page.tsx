import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { getSetupStatus } from "@/app/setup/actions";
import { getPortalUrlConfig } from "./actions";
import { PortalUrlForm } from "./PortalUrlForm";

export const metadata: Metadata = {
  title: "Portal URL — Protegey Partner",
};

export default async function PortalUrlSettingsPage() {
  const [user, lang, setupStatus] = await Promise.all([getSessionUser(), getLang(), getSetupStatus()]);
  // Only meaningful on an on-premise deployment — see OnPremisePortalUrlController. SaaS partners
  // all share the one Protegey-operated portal domain, nothing for them to configure here.
  if (!setupStatus.enabled) redirect("/settings");

  const denied = requirePageAccess(user, "partners.manage_organization", lang);
  if (denied) return denied;

  const config = await getPortalUrlConfig();
  const canManage = user?.permissions.includes("partners.manage_organization") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "navPortalUrlSettings")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "portalUrlSubtitle")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <PortalUrlForm initialUrl={config.partnerPortalUrl} canManage={canManage} />
      </div>
    </div>
  );
}
