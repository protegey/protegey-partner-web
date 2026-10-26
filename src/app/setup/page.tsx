import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetupForm } from "./SetupForm";
import { getSetupStatus } from "./actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Set up your organization — Protegey Partner",
};

export default async function SetupPage() {
  const [status, lang] = await Promise.all([getSetupStatus(), getLang()]);

  // Not an on-premise build, or this deployment's one partner already exists — the backend's
  // own POST /setup/bootstrap would refuse either case anyway (see SetupService), but redirecting
  // here means a stray /setup link (bookmarked, or just guessed) never shows a form that can
  // only ever fail.
  if (!status.enabled || status.completed) {
    redirect("/login");
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg py-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-semibold text-foreground">{t(lang, "setupPageHeading")}</h1>
              <p className="text-sm text-muted-foreground">{t(lang, "setupPageSubtitle")}</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <SetupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
