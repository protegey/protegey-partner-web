import type { Metadata } from "next";
import { getPlans, getCurrentPlanCode } from "./actions";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { Check } from "lucide-react";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const BILLING_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Facturation & Plans",
    explanation:
      "Cette page montre les différents plans disponibles (Starter, Professional, Business, Enterprise) et met en évidence celui que tu utilises actuellement. Chaque plan débloque des fonctionnalités différentes — par exemple, le criblage/conformité avancé (Risk & Compliance) n'est disponible qu'en Enterprise.\n\nTu ne peux pas changer de plan toi-même ici : il faut contacter Protegey pour passer à un plan supérieur ou inférieur.",
  },
  en: {
    title: "Billing & Plans",
    explanation:
      "This page shows the different available plans (Starter, Professional, Business, Enterprise) and highlights the one you're currently on. Each plan unlocks different features — for example, advanced screening/compliance (Risk & Compliance) is only available on Enterprise.\n\nYou can't switch plans yourself here: you need to contact Protegey to move to a higher or lower plan.",
  },
};

export const metadata: Metadata = {
  title: "Billing & Plans — Protegey Partner",
};

export default async function BillingPage() {
  const [plans, currentPlanCode, lang] = await Promise.all([getPlans(), getCurrentPlanCode(), getLang()]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "billingPageTitle")}</h1>
          <PageGuideButton content={BILLING_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "billingPageSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.code === currentPlanCode;
          const name = lang === "fr" ? plan.nameFr : plan.name;
          const description = lang === "fr" ? plan.descriptionFr : plan.description;
          const priceLabel = lang === "fr" ? plan.priceLabelFr : plan.priceLabel;

          return (
            <div
              key={plan.id}
              className={`flex flex-col gap-4 rounded-md border p-5 ${
                isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
              }`}
            >
              <div>
                {isCurrent ? (
                  <span className="mb-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {t(lang, "billingCurrentPlanBadge")}
                  </span>
                ) : null}
                <p className="text-base font-semibold text-foreground">{name}</p>
                {priceLabel ? <p className="mt-0.5 text-xs font-medium text-muted-foreground">{priceLabel}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">{description}</p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-1.5 text-xs text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {lang === "fr" ? feature.labelFr : feature.label}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">{t(lang, "billingContactToChange")}</p>
    </div>
  );
}
