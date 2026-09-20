import Link from "next/link";
import { ShieldOff, Hourglass } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import type { SharedSignalNetworkStatus } from "./actions";

export async function SharedSignalNetworkGate({ status }: { status: SharedSignalNetworkStatus }) {
  const lang = await getLang();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "sharedSignalNetworkPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "sharedSignalNetworkPageSubtitle")}</p>
      </div>

      {!status.enabled ? (
        <div className="flex items-start gap-3 rounded-md border border-border bg-card p-5">
          <ShieldOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{t(lang, "sharedSignalGateDisabledTitle")}</p>
            <p className="text-sm text-muted-foreground">{t(lang, "sharedSignalGateDisabledBody")}</p>
            <Link href="/settings/profile" className="mt-1 w-fit rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
              {t(lang, "sharedSignalGateGoToSettings")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-md border border-border bg-card p-5">
          <Hourglass className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{t(lang, "sharedSignalGateWaitingTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t(lang, "sharedSignalGateWaitingBody").replace("{n}", String(status.daysUntilEligible))}
            </p>
            {status.enabledAt ? (
              <p className="text-xs text-muted-foreground">
                {t(lang, "sharedSignalGateEnabledSince")} {new Date(status.enabledAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
