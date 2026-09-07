import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getPartnerSettings } from "./actions";
import { LogoUploadForm } from "./LogoUploadForm";

export const metadata: Metadata = {
  title: "Settings — Protegey Partner",
};

export default async function SettingsPage() {
  const [user, partner] = await Promise.all([getSessionUser(), getPartnerSettings()]);
  const canManageSettings = user?.permissions.includes("partners.manage_settings") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage how {partner.name} appears to your own clients.</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Organization logo</p>
        <LogoUploadForm organizationName={partner.name} hasLogo={Boolean(partner.logoFileName)} canManage={canManageSettings} />
      </div>
    </div>
  );
}
