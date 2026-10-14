"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { setSandboxModeAction } from "@/lib/sandbox-mode-actions";

/**
 * Same pattern as LangProvider's setLang: flip local state immediately, persist to the cookie,
 * then refresh so every server-rendered page (which reads the cookie on its next request)
 * picks up the change right away — not just on the next navigation.
 */
export function SandboxModeToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const router = useRouter();
  const { t } = useLang();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSandboxModeAction(next)
      .then(() => router.refresh())
      .catch(() => setEnabled(!next));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? t("sandboxModeToggleAriaOn") : t("sandboxModeToggleAriaOff")}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        enabled
          ? "border-amber-500/40 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
          : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      <FlaskConical className="size-3.5" />
      {enabled ? t("sandboxModeToggleTest") : t("sandboxModeToggleLive")}
    </button>
  );
}
