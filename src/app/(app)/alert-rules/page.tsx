import type { Metadata } from "next";
import { getAlertRules } from "./actions";
import { AlertRulesBoard } from "./AlertRulesBoard";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const ALERT_RULES_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Pan Studio — Règles d'alerte",
    explanation:
      "C'est ici que tu définis les règles qui déclenchent des alertes ailleurs dans le produit. Une règle a un seuil (montant, vitesse, nombre de tentatives…), une gravité (revue simple, vérification renforcée, blocage, escalade) et un segment de clientèle (agent, super-agent, marchand, entreprise, ou tout le monde).\n\nIl existe deux familles de règles : les règles « transaction », évaluées à chaque paiement qui arrive, et les règles « identité », évaluées une seule fois au moment d'une décision KYC (par exemple : ce document d'identité est déjà utilisé par un autre client). Une règle peut être créée à la main, générée automatiquement par le système, ou proposée par l'assistant IA intégré à cette page.\n\nActiver, désactiver ou modifier une règle ici change immédiatement ce qui remonte en Alertes — c'est le seul endroit où on peut agir sur le comportement du moteur de détection.",
    diagram: [
      [{ label: "Règles d'alerte", note: "Pan Studio — créées ici", current: true }],
      [
        { label: "Moteur de transactions", note: "évalue chaque paiement" },
        { label: "Décision KYC", note: "évaluée une fois par vérification" },
      ],
      [{ label: "Alertes", note: "si une règle se déclenche" }],
      [{ label: "Dossier", note: "si l'alerte est critique" }],
    ],
    diagramCaption: "Modifier une règle ici change directement ce qui déclenche une alerte, sans redéploiement.",
  },
  en: {
    title: "Pan Studio — Alert rules",
    explanation:
      "This is where you define the rules that trigger alerts elsewhere in the product. A rule has a threshold (amount, velocity, attempt count…), a severity (plain review, step-up verification, block, escalate) and a customer segment (agent, super-agent, merchant, corporate, or everyone).\n\nThere are two families of rules: \"transaction\" rules, evaluated on every incoming payment, and \"identity\" rules, evaluated once per KYC decision (for example: this ID document is already used by another customer). A rule can be created by hand, generated automatically by the system, or suggested by the AI assistant built into this page.\n\nTurning a rule on, off, or editing it here immediately changes what surfaces in Alerts — this is the one place you can steer the detection engine's behavior.",
    diagram: [
      [{ label: "Alert rules", note: "Pan Studio — authored here", current: true }],
      [
        { label: "Transaction engine", note: "evaluates every payment" },
        { label: "KYC decision", note: "evaluated once per verification" },
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
  const [rules, lang] = await Promise.all([getAlertRules(), getLang()]);

  return (
    <div className="mx-auto flex min-h-0 max-w-6xl flex-1 flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Pan-Monitor™ — {t(lang, "alertRulesTitle")}</h1>
          <PageGuideButton content={ALERT_RULES_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "alertRulesSubtitle")}</p>
      </div>

      <AlertRulesBoard initialRules={rules} />
    </div>
  );
}
