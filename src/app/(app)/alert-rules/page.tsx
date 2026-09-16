import type { Metadata } from "next";
import { getAlertRules } from "./actions";
import { AlertRulesBoard } from "./AlertRulesBoard";

export const metadata: Metadata = {
  title: "Alert Rules — Protegey Partner",
};

export default async function AlertRulesPage() {
  const rules = await getAlertRules();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pan-Monitor™ — Alert Rules</h1>
        <p className="text-sm text-muted-foreground">
          Transaction-monitoring rules evaluated against every transaction you submit. System defaults are shared
          across every institution — editing one forks your own copy, the shared default is never changed. Every
          rule you or Pan-Studio proposes starts as a draft and only fires once you switch it to active.
        </p>
      </div>

      <AlertRulesBoard initialRules={rules} />
    </div>
  );
}
