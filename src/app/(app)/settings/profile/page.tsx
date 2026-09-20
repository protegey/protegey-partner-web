import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getPartnerSettings } from "./actions";
import { LogoUploadForm } from "./LogoUploadForm";
import { SharedSignalsToggle } from "./SharedSignalsToggle";

export const metadata: Metadata = {
  title: "Organization Profile — Protegey Partner",
};

export default async function OrganizationProfilePage() {
  const [user, partner, lang] = await Promise.all([getSessionUser(), getPartnerSettings(), getLang()]);
  const canManageSettings = user?.permissions.includes("partners.manage_settings") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "navOrganizationProfile")}</h1>
        <p className="text-sm text-muted-foreground">
          {t(lang, "settingsSubtitlePrefix")} {partner.name} {t(lang, "settingsSubtitleSuffix")}
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "settingsOrgLogoTitle")}</p>
        <LogoUploadForm organizationName={partner.name} hasLogo={Boolean(partner.logoFileName)} canManage={canManageSettings} />
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "sharedSignalsCardTitle")}</p>
        <SharedSignalsToggle initialEnabled={partner.sharedSignalsEnabled} canManage={canManageSettings} />
      </div>
    </div>
  );
}
