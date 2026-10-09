import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { ZoomableSequenceDiagram } from "@/components/ZoomableSequenceDiagram";

export const metadata: Metadata = {
  title: "Decision Flow — Protegey Partner",
};

const STEP_KEYS = [
  "decisionFlowStep1",
  "decisionFlowStep2",
  "decisionFlowStep3",
  "decisionFlowStep4",
  "decisionFlowStep5",
  "decisionFlowStep6",
  "decisionFlowStep7",
  "decisionFlowStep8",
] as const;

export default async function DecisionFlowPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_integrations", lang);
  if (denied) return denied;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{t(lang, "decisionFlowPageTitle")}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(lang, "decisionFlowIntro")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <ZoomableSequenceDiagram
          lang={lang}
          dialogTitle={t(lang, "decisionFlowPageTitle")}
          closeAriaLabel={t(lang, "closeDialogAria")}
        />
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">{t(lang, "decisionFlowStepsTitle")}</p>
        <ol className="flex flex-col gap-3">
          {STEP_KEYS.map((key, i) => (
            <li key={key} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-foreground">{t(lang, key)}</p>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-sm text-muted-foreground">
        {t(lang, "decisionFlowSeeAlso")}{" "}
        <Link href="/documentation#transactions" className="font-medium text-primary hover:underline">
          /documentation
        </Link>
      </p>
    </div>
  );
}
