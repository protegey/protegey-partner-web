import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInvitationForm } from "./AcceptInvitationForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Accept invitation — Protegey Partner",
};

export default async function AcceptInvitationPage() {
  const lang = await getLang();
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-semibold text-foreground">{t(lang, "acceptInvitationPageTitle")}</h1>
              <p className="text-sm text-muted-foreground">{t(lang, "acceptInvitationPageSubtitle")}</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <Suspense>
              <AcceptInvitationForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
