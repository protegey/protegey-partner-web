import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getApiCredentials } from "./actions";
import { ApiAccessSection } from "./ApiAccessSection";

export const metadata: Metadata = {
  title: "Settings — Protegey Partner",
};

export default async function SettingsPage() {
  const [user, credentials] = await Promise.all([getSessionUser(), getApiCredentials()]);
  const canManageSettings = user?.permissions.includes("partners.manage_settings") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your API integration.</p>
      </div>

      <ApiAccessSection credentials={credentials} canManage={canManageSettings} />
    </div>
  );
}
