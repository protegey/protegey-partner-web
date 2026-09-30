import { Check } from "lucide-react";
import type { KybFormSchema } from "@/app/(app)/clients/actions";

/**
 * Shared between the real applicant-facing wizard and the partner's own builder preview — a
 * separate copy here would drift the moment one of them changed, exactly the divergence this
 * whole dynamic-form system is built to avoid (see `DynamicKybField`'s own docblock).
 *
 * `onStepClick` is deliberately opt-in: the real applicant form omits it, since letting an
 * applicant jump straight to any step would bypass the per-step required-field validation that
 * gates "Next" — the partner's own preview passes it, since free navigation while reviewing your
 * own draft form is exactly what you want, and nothing there is actually being submitted.
 */
export function KybStepIndicator({
  sections,
  stepIndex,
  onStepClick,
}: {
  sections: KybFormSchema;
  stepIndex: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <div className="flex justify-center overflow-x-auto pb-1">
      <div className="flex items-center gap-1.5">
        {sections.map((section, index) => {
          const circle = (
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                index < stepIndex
                  ? "bg-primary text-primary-foreground"
                  : index === stepIndex
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground"
              } ${onStepClick ? "cursor-pointer hover:opacity-80" : ""}`}
            >
              {index < stepIndex ? <Check className="size-3.5" /> : index + 1}
            </div>
          );
          return (
            <div key={section.id} className="flex items-center gap-1.5">
              {onStepClick ? (
                <button type="button" onClick={() => onStepClick(index)} aria-label={section.title || `Step ${index + 1}`}>
                  {circle}
                </button>
              ) : (
                circle
              )}
              {index < sections.length - 1 ? <div className="h-px w-4 shrink-0 bg-border sm:w-8" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
