"use client";

import { Lock } from "lucide-react";
import { useScreenLock } from "./ScreenLockProvider";
import { useLang } from "@/lib/i18n/LangProvider";

/** No confirmation dialog, unlike SignOutButton — locking is low-risk and instantly reversible
 * with your own password, nothing is lost or ended the way signing out is. */
export function LockButton({ className }: { className?: string }) {
  const { lock } = useScreenLock();
  const { t } = useLang();

  return (
    <button type="button" onClick={lock} aria-label={t("lockScreenButtonAria")} className={className}>
      <Lock className="size-4" />
      <span className="hidden sm:inline">{t("lockScreenButtonLabel")}</span>
    </button>
  );
}
