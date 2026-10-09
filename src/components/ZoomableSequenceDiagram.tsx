"use client";

import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { TransactionSequenceDiagram } from "@/components/TransactionSequenceDiagram";

/** Click the diagram to open the same drawing at full size in a modal — the diagram itself has a
 * fair amount of small print (field names, event types), so a dedicated full-size view matters
 * more here than for a typical illustration. */
export function ZoomableSequenceDiagram({
  lang,
  dialogTitle,
  closeAriaLabel,
}: {
  lang: "en" | "fr";
  dialogTitle: string;
  closeAriaLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full cursor-zoom-in rounded-md border border-border bg-muted/30 p-4 text-left transition-colors hover:border-primary/40"
      >
        <TransactionSequenceDiagram lang={lang} />
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-3.5" />
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={dialogTitle} maxWidthClassName="max-w-[96vw]" closeAriaLabel={closeAriaLabel}>
        <div className="overflow-x-auto">
          <TransactionSequenceDiagram lang={lang} />
        </div>
      </Dialog>
    </>
  );
}
