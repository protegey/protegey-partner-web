"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { setSandboxModeAction } from "@/lib/sandbox-mode-actions";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

/**
 * Switching modes changes which data (and which account effects) the whole portal shows, so a
 * click only opens a confirmation — the actual switch happens on confirm. Same persist-then-
 * refresh pattern as LangProvider's setLang otherwise: flip local state, persist to the cookie,
 * refresh so every server-rendered page picks up the change right away.
 */
export function SandboxModeToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { t } = useLang();

  const switchingToTest = !enabled;

  function confirmToggle() {
    const next = !enabled;
    setPending(true);
    setSandboxModeAction(next)
      .then(() => {
        setEnabled(next);
        setConfirming(false);
        router.refresh();
      })
      .finally(() => setPending(false));
  }

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
        onConfirm={confirmToggle}
        title={t(switchingToTest ? "sandboxConfirmToTestTitle" : "sandboxConfirmToLiveTitle")}
        description={t(switchingToTest ? "sandboxConfirmToTestDescription" : "sandboxConfirmToLiveDescription")}
        confirmLabel={t(switchingToTest ? "sandboxConfirmToTestConfirm" : "sandboxConfirmToLiveConfirm")}
        pendingLabel={t("commonWorking")}
        pending={pending}
      />
    </>
  );
}
