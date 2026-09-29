import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getPartnerSettings } from "./actions";
import { LogoUploadForm } from "./LogoUploadForm";
import { SharedSignalsToggle } from "./SharedSignalsToggle";
import { NotificationsEmailForm } from "./NotificationsEmailForm";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const PROFILE_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Profil de l'organisation",
    explanation:
      "Ici tu gères l'identité visuelle de ton organisation (le logo affiché dans le produit) et un interrupteur important : la participation au Réseau de signaux partagés. L'activer ici est la première étape — après une période d'attente réglementaire, tu pourras partager les identifiants de fraudeurs confirmés vers le pool commun entre partenaires Protegey, et interroger les leurs.\n\nC'est une page de configuration de compte : rien ici n'affecte directement une alerte ou un dossier, mais ça ouvre ou ferme l'accès à d'autres fonctionnalités du produit.",
  },
  en: {
    title: "Organization profile",
    explanation:
      "Here you manage your organization's visual identity (the logo shown in the product) and one important switch: participation in the Shared Signal Network. Turning it on here is the first step — after a regulatory waiting period, you'll be able to share confirmed fraudsters' identifiers into the cross-partner pool, and query others'.\n\nThis is an account configuration page: nothing here directly affects an alert or a case, but it opens or closes access to other parts of the product.",
  },
};

export const metadata: Metadata = {
  title: "Organization Profile — Protegey Partner",
};

export default async function OrganizationProfilePage() {
  const [user, partner, lang] = await Promise.all([getSessionUser(), getPartnerSettings(), getLang()]);
  const canManageSettings = user?.permissions.includes("partners.manage_settings") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "navOrganizationProfile")}</h1>
          <PageGuideButton content={PROFILE_GUIDE[lang]} />
        </div>
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

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "notificationsEmailCardTitle")}</p>
        <NotificationsEmailForm initialEmail={partner.notificationsEmail ?? partner.contactEmail ?? ""} canManage={canManageSettings} />
      </div>
    </div>
  );
}
