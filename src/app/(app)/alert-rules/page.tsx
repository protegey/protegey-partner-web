import type { Metadata } from "next";
import { getAlertRules } from "./actions";
import { AlertRulesBoard } from "./AlertRulesBoard";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Alert Rules — Protegey Partner",
};

export default async function AlertRulesPage() {
  const [rules, lang] = await Promise.all([getAlertRules(), getLang()]);

  return (
    <div className="mx-auto flex min-h-0 max-w-6xl flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pan-Monitor™ — {t(lang, "alertRulesTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "alertRulesSubtitle")}</p>
      </div>

      <AlertRulesBoard initialRules={rules} />
    </div>
  );
}
