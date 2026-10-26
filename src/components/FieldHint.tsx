import { HelpCircle } from "lucide-react";

/**
 * A small "?" icon next to a field label — hover (or focus, for keyboard/touch) reveals a short
 * plain-language explanation of what the field is and what to put in it. Pure CSS (group-hover),
 * no JS state, no extra dependency — for the page-level equivalent (a whole page's purpose,
 * opened by a click rather than a hover), see PageGuideButton instead.
 */
export function FieldHint({ text }: { text: string }) {
  return (
    <span tabIndex={0} className="group relative inline-flex outline-none">
      <HelpCircle className="size-3.5 cursor-help text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{text}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-60 -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-normal normal-case leading-snug text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
