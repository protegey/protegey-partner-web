"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { DocumentUploadRow } from "./DocumentUploadRow";
import type { PartnerDocument } from "./actions";

function isActionable(document: PartnerDocument): boolean {
  return document.status === "pending" || document.status === "rejected";
}

/**
 * Walks the partner through their still-outstanding documents one at a time instead of
 * dumping all of them on screen at once. The step order is frozen on mount — a document
 * leaving "actionable" (once uploaded) doesn't reshuffle the remaining steps.
 */
export function DocumentUploadWizard({ documents }: { documents: PartnerDocument[] }) {
  const [frozenIds] = useState(() => documents.filter(isActionable).map((document) => document.id));
  const [stepIndex, setStepIndex] = useState(0);

  if (frozenIds.length === 0) {
    return null;
  }

  const current = documents.find((document) => document.id === frozenIds[stepIndex]);
  if (!current) {
    // stepIndex has advanced past the last step — nothing left to do here.
    return null;
  }

  const canAdvance = !isActionable(current);
  const isLastStep = stepIndex === frozenIds.length - 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2">
        {frozenIds.map((id, index) => {
          const document = documents.find((d) => d.id === id);
          const done = document ? !isActionable(document) : false;
          return (
            <div
              key={id}
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                index === stepIndex
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Document {stepIndex + 1} of {frozenIds.length}
      </p>

      <DocumentUploadRow key={current.id} document={current} />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
          disabled={stepIndex === 0}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((index) => index + 1)}
          disabled={!canAdvance}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastStep ? "Finish" : "Continue"}
        </button>
      </div>
    </div>
  );
}
