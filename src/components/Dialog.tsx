"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClassName = "max-w-lg",
  closeAriaLabel = "Close dialog",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Override the modal's width — e.g. "max-w-2xl" for content-heavy dialogs. */
  maxWidthClassName?: string;
  closeAriaLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  // Rendered via a portal straight to <body> — deliberately, not for lack of trying to keep it in
  // the normal tree. A `fixed inset-0` element only ever covers the true viewport when NONE of its
  // ancestors has a transform/filter/perspective/will-change set — any one of them (present today
  // or added later, anywhere up the tree, including by code that has nothing to do with dialogs)
  // silently turns that ancestor into the containing block instead, shrinking the backdrop down to
  // that ancestor's own box. A portal sidesteps the whole category permanently: this DOM subtree's
  // parent is always `document.body` itself, never whatever page happens to render the button.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative flex max-h-[90vh] w-full ${maxWidthClassName} animate-scale-in flex-col overflow-hidden rounded-md border border-border bg-card shadow-xl`}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={closeAriaLabel}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
