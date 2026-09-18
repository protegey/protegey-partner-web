"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { resendAgentInvitationAction } from "./actions";

export function ResendInvitationButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t } = useLang();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  async function handleClick() {
    setPending(true);
    const res = await guard(() => resendAgentInvitationAction(invitationId));
    setPending(false);
    setResult(res);
    if (res?.success) router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      >
        {pending ? t("clientsResendSending") : t("clientsResendButton")}
      </button>
      {result?.error ? <p className="text-xs text-destructive">{result.error}</p> : null}
      {result?.success ? <p className="text-xs text-primary">{t("clientsResendSent")}</p> : null}
    </div>
  );
}
