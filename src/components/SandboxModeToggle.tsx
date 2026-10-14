"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { setSandboxModeAction } from "@/lib/sandbox-mode-actions";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

/**
 * Same pattern as LangProvider's setLang: flip local state immediately, persist to the cookie,
 * then refresh so every server-rendered page (which reads the cookie on its next request)
 * picks up the change right away — not just on the next navigation.
 */
export function SandboxModeToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const { t } = useLang();

  function toggle() {
    const next = !enabled;
    setConfirming(false);
    setEnabled(next);
    setSandboxModeAction(next)
      .then(() => router.refresh())
      .catch(() => setEnabled(!next));
  }

  // Switching changes which data (and which account effects) the whole portal shows, so the
  // click only opens a confirmation — the actual switch happens on confirm.
  const switchingToTest = !enabled;

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
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
      <ConfirmActionDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={toggle}
        title={t(switchingToTest ? "sandboxConfirmToTestTitle" : "sandboxConfirmToLiveTitle")}
        description={t(switchingToTest ? "sandboxConfirmToTestDescription" : "sandboxConfirmToLiveDescription")}
        confirmLabel={t(switchingToTest ? "sandboxConfirmToTestConfirm" : "sandboxConfirmToLiveConfirm")}
      />
    </>
  );
}
