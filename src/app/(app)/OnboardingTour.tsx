"use client";

import { useEffect, useState } from "react";
import {
  X,
  LayoutDashboard,
  Activity,
  Fingerprint,
  IdCard,
  ShieldCheck,
  Briefcase,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import type { StringKey } from "@/lib/i18n/strings";

const STORAGE_KEY = "protegey_partner_onboarding_tour_seen";

interface Step {
  icon: typeof LayoutDashboard;
  titleKey: StringKey;
  bodyKey: StringKey;
}

const STEPS: Step[] = [
  { icon: Sparkles, titleKey: "tourWelcomeTitle", bodyKey: "tourWelcomeBody" },
  { icon: LayoutDashboard, titleKey: "tourDashboardTitle", bodyKey: "tourDashboardBody" },
  { icon: Activity, titleKey: "tourPanMonitorTitle", bodyKey: "tourPanMonitorBody" },
  { icon: Fingerprint, titleKey: "tourPanGuardTitle", bodyKey: "tourPanGuardBody" },
  { icon: IdCard, titleKey: "tourPanIdTitle", bodyKey: "tourPanIdBody" },
  { icon: ShieldCheck, titleKey: "tourPanRiskTitle", bodyKey: "tourPanRiskBody" },
  { icon: Briefcase, titleKey: "tourCasesTitle", bodyKey: "tourCasesBody" },
  { icon: KeyRound, titleKey: "tourIntegrationsTitle", bodyKey: "tourIntegrationsBody" },
];

/** Shown once, the first time a user opens the app — a quick guided overview of every major section. Same one-time-per-browser convention as KybWelcomeModal. */
export function OnboardingTour() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — skip the one-time tour.
    }
  }, []);

  function finish() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Nothing to do — worst case the tour shows again next visit.
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (event.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={finish} aria-hidden="true" />
      <div className="relative flex w-full max-w-md flex-col gap-4 rounded-md border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("close")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">{t(current.titleKey)}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(current.bodyKey)}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("tourSkip")}
          </button>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("tourPrevious")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {isLast ? t("tourFinish") : t("tourNext")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
