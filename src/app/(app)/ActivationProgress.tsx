import { Check } from "lucide-react";

const STEPS = ["Onboarded", "Verification", "Active"] as const;

export function ActivationProgress({ status }: { status: string }) {
  // Every partner account that can reach this layout has already been onboarded (step 0 is
  // always complete). Step 1 (verification) is complete only once approved; step 2 (active)
  // mirrors the real `PartnerStatus` enum rather than a fabricated "production ready" idea.
  const currentIndex = status === "active" ? 2 : 1;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-1 py-3">
      <p className="px-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Activation</p>
      <div className="flex flex-col gap-2 px-2">
        {STEPS.map((step, index) => {
          const done = index < currentIndex || (index === currentIndex && status === "active");
          const current = index === currentIndex && !done;
          return (
            <div key={step} className="flex items-center gap-2">
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] ${
                  done ? "bg-primary text-primary-foreground" : current ? "border-2 border-primary" : "border border-border"
                }`}
              >
                {done ? <Check className="size-2.5" /> : null}
              </span>
              <span className={`text-xs ${done || current ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
