"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Dialog } from "./Dialog";
import { FlowDiagram, type FlowDiagramNode } from "./FlowDiagram";
import { useLang } from "@/lib/i18n/LangProvider";

export interface PageGuideContent {
  /** The page's own title — reused as the dialog title, so it's obvious what's being explained. */
  title: string;
  /** Plain-language explanation of what this page is for and what its values mean — written so a
   * complete beginner can follow it, not a feature list. Line breaks become paragraphs. */
  explanation: string;
  /** How this module talks to the rest of the product — an ordered pipeline of stages. Omit for a
   * page that doesn't sit in a data pipeline (e.g. a settings form). */
  diagram?: FlowDiagramNode[][];
  diagramCaption?: string;
}

export function PageGuideButton({ content }: { content: PageGuideContent }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("pageGuideButtonAria")}
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <HelpCircle className="size-4" />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={content.title} maxWidthClassName="max-w-xl" closeAriaLabel={t("closeDialogAria")}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
            {content.explanation.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {content.diagram ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("pageGuideDiagramLabel")}</p>
              <FlowDiagram stages={content.diagram} />
              {content.diagramCaption ? <p className="mt-2 text-xs text-muted-foreground">{content.diagramCaption}</p> : null}
            </div>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
