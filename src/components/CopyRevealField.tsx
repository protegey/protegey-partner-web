"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";

/** A copy-to-clipboard reveal box for a secret shown exactly once (a fresh API key or webhook secret). */
export function CopyRevealField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLang();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the value is still selectable below.
    }
  }

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
      <p className="text-xs font-medium text-amber-700">{label} — {t("settingsCopyRevealSuffix")}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
          {copied ? t("kycFormCopied") : t("kycFormCopy")}
        </button>
      </div>
    </div>
  );
}
