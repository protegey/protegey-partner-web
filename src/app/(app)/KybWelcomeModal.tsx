"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

const STORAGE_KEY = "protegey_partner_kyb_welcome_seen";

/** Shown once, the first time a partner lands on their account while still unverified. */
export function KybWelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — skip the one-time welcome.
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Nothing to do — worst case the welcome shows again next visit.
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={dismiss} aria-hidden="true" />
      <div className="relative flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-card shadow-xl">
        <div className="relative hidden w-2/5 shrink-0 bg-[#1DB980] sm:block">
          <Image src="/images/document_illustration.png" alt="" fill className="object-cover" />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Welcome to Protegey</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Let&apos;s get your organization verified.</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="text-sm text-foreground">
            Before you can access your dashboard, team and clients, we need to verify your organization. Please
            submit the required documents below to continue.
          </p>

          <div className="mt-auto flex justify-end">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
