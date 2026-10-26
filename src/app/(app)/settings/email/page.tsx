import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { getSetupStatus } from "@/app/setup/actions";
import { getMailConfig } from "./actions";
import { EmailConfigForm } from "./EmailConfigForm";

export const metadata: Metadata = {
  title: "Email — Protegey Partner",
};

export default async function EmailSettingsPage() {
  const [user, lang, setupStatus] = await Promise.all([getSessionUser(), getLang(), getSetupStatus()]);
  // Mail provider configuration is only partner-editable on an on-premise deployment — see
  // OnPremiseSettingsController. A SaaS partner landing here directly (stale link, typed URL)
  // gets sent back to Settings rather than a confusing empty/erroring form.
  if (!setupStatus.enabled) redirect("/settings");

  const denied = requirePageAccess(user, "partners.manage_organization", lang);
  if (denied) return denied;

  const config = await getMailConfig();
  const canManage = user?.permissions.includes("partners.manage_organization") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "navEmailSettings")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "emailSettingsSubtitle")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <EmailConfigForm initial={config} canManage={canManage} />
      </div>
    </div>
  );
}
