import type { Metadata } from "next";
import { getAlertRules, getAssistantStatus } from "./actions";
import { AlertRulesBoard } from "./AlertRulesBoard";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const ALERT_RULES_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Pan Studio",
    explanation:
      "C'est ici que tu définis les règles qui déclenchent des alertes ailleurs dans le produit. Une règle a un seuil (montant, vitesse, nombre de tentatives…), une gravité (revue simple, vérification renforcée, blocage, escalade) et un segment de clientèle (agent, super-agent, marchand, entreprise, ou tout le monde).\n\nChaque règle appartient à un module, choisi avant même de la décrire : Transaction (évaluée à chaque paiement), KYC (évaluée une fois par décision d'identité, ex. un document déjà utilisé ailleurs), KYB (évaluée une fois par dossier entreprise, ex. un bénéficiaire effectif partagé entre plusieurs sociétés) ou Pan-Intel (évaluée à chaque signal d'appareil/session, ex. un changement de carte SIM). Le module choisi détermine ce que l'assistant IA a le droit d'utiliser — il refuse plutôt que d'inventer un champ qui n'existe pas dans ce module.\n\nActiver, désactiver ou modifier une règle ici change immédiatement ce qui remonte en Alertes — c'est le seul endroit où on peut agir sur le comportement du moteur de détection.",
    diagram: [
      [{ label: "Règles Pan Studio", note: "créées ici, par module", current: true }],
      [
        { label: "Transactions" },
        { label: "Décisions KYC" },
        { label: "Dossiers KYB" },
        { label: "Signaux Pan-Intel" },
      ],
      [{ label: "Alertes", note: "si une règle se déclenche" }],
      [{ label: "Dossier", note: "si l'alerte est critique" }],
    ],
    diagramCaption: "Modifier une règle ici change directement ce qui déclenche une alerte, sans redéploiement.",
  },
  en: {
    title: "Pan Studio",
    explanation:
      "This is where you define the rules that trigger alerts elsewhere in the product. A rule has a threshold (amount, velocity, attempt count…), a severity (plain review, step-up verification, block, escalate) and a customer segment (agent, super-agent, merchant, corporate, or everyone).\n\nEvery rule belongs to a module, chosen before you even describe it: Transaction (evaluated on every payment), KYC (evaluated once per identity decision, e.g. a document already used elsewhere), KYB (evaluated once per business application, e.g. a beneficial owner shared across several companies) or Pan-Intel (evaluated on every device/session signal, e.g. a SIM swap). The chosen module decides what the AI assistant is allowed to use — it declines rather than inventing a field that doesn't exist in that module.\n\nTurning a rule on, off, or editing it here immediately changes what surfaces in Alerts — this is the one place you can steer the detection engine's behavior.",
    diagram: [
      [{ label: "Pan Studio rules", note: "authored here, per module", current: true }],
      [
        { label: "Transactions" },
        { label: "KYC decisions" },
        { label: "KYB applications" },
        { label: "Pan-Intel signals" },
      ],
      [{ label: "Alerts", note: "if a rule fires" }],
      [{ label: "Case", note: "if the alert is critical" }],
    ],
    diagramCaption: "Editing a rule here directly changes what triggers an alert, with no redeploy needed.",
  },
};

export const metadata: Metadata = {
  title: "Alert Rules — Protegey Partner",
};

export default async function AlertRulesPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, ["partners.manage_alert_rules", "partners.view_alert_rules"], lang);
  if (denied) return denied;

  const [rules, assistantStatus] = await Promise.all([getAlertRules(), getAssistantStatus()]);

  return (
    <div className="mx-auto flex min-h-0 max-w-6xl flex-1 flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "navAlertRules")}</h1>
          <PageGuideButton content={ALERT_RULES_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "alertRulesSubtitle")}</p>
      </div>

      <AlertRulesBoard initialRules={rules} assistantConfigured={assistantStatus.configured} />
    </div>
  );
}
