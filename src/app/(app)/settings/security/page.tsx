import type { Metadata } from "next";
import { SecurityForm } from "./SecurityForm";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const SECURITY_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Sécurité",
    explanation:
      "Cette page gère la sécurité de TON propre compte utilisateur (pas celle de tes clients) : changer ton mot de passe, et bientôt activer la double authentification (2FA), pour l'instant marquée « à venir ».\n\nC'est une page de compte personnel, séparée de la page Équipe qui gère les accès de tes collègues.",
  },
  en: {
    title: "Security",
    explanation:
      "This page manages the security of YOUR OWN user account (not your customers'): changing your password, and soon enabling two-factor authentication (2FA), currently marked \"coming soon\".\n\nThis is a personal account page, separate from the Team page which manages your colleagues' access.",
  },
};

export const metadata: Metadata = {
  title: "Security — Protegey Partner",
};

export default async function SecurityPage() {
  const lang = await getLang();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "securityPageTitle")}</h1>
          <PageGuideButton content={SECURITY_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "securityPageSubtitle")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">{t(lang, "securityPasswordCardTitle")}</p>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">{t(lang, "securityPasswordCardBody")}</p>
        <SecurityForm />
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{t(lang, "security2faCardTitle")}</p>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t(lang, "soonBadge")}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t(lang, "security2faCardBody")}</p>
      </div>
    </div>
  );
}
