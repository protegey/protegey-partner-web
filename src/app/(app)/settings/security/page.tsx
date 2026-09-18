import type { Metadata } from "next";
import { SecurityForm } from "./SecurityForm";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Security — Protegey Partner",
};

export default async function SecurityPage() {
  const lang = await getLang();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "securityPageTitle")}</h1>
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
