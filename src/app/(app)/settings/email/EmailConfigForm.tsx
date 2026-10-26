"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updateMailConfigAction, type MailConfig } from "./actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function EmailConfigForm({ initial, canManage }: { initial: MailConfig; canManage: boolean }) {
  const guard = useSessionGuard();
  const { t } = useLang();
  const [resendApiKey, setResendApiKey] = useState("");
  const [fromAddress, setFromAddress] = useState(initial.fromAddress ?? "");
  const [fromName, setFromName] = useState(initial.fromName ?? "");
  const [hasResendApiKey, setHasResendApiKey] = useState(initial.hasResendApiKey);
  const [configured, setConfigured] = useState(initial.configured);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await guard(() =>
        updateMailConfigAction({
          ...(resendApiKey.trim() ? { resendApiKey: resendApiKey.trim() } : {}),
          ...(fromAddress.trim() ? { fromAddress: fromAddress.trim() } : {}),
          ...(fromName.trim() ? { fromName: fromName.trim() } : {}),
        }),
      );
      if (result === null) return;
      if (isError(result)) {
        toast.error(result.error);
        return;
      }
      const nowHasApiKey = hasResendApiKey || resendApiKey.trim() !== "";
      setConfigured(nowHasApiKey && fromAddress.trim() !== "");
      setHasResendApiKey(nowHasApiKey);
      setResendApiKey("");
      toast.success(t("emailSettingsSavedToast"));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className={`size-2 rounded-full ${configured ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
        <span className="text-muted-foreground">{configured ? t("emailSettingsStatusActive") : t("emailSettingsStatusInactive")}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="resendApiKey" className="text-sm font-medium text-foreground">
          {t("emailSettingsApiKeyLabel")}
        </label>
        <input
          id="resendApiKey"
          type="password"
          autoComplete="off"
          value={resendApiKey}
          onChange={(e) => setResendApiKey(e.target.value)}
          disabled={!canManage || saving}
          placeholder={hasResendApiKey ? t("emailSettingsApiKeyAlreadySet") : "re_..."}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fromAddress" className="text-sm font-medium text-foreground">
            {t("emailSettingsFromAddressLabel")}
          </label>
          <input
            id="fromAddress"
            type="email"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            disabled={!canManage || saving}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fromName" className="text-sm font-medium text-foreground">
            {t("emailSettingsFromNameLabel")}
          </label>
          <input
            id="fromName"
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            disabled={!canManage || saving}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!canManage || saving}
        onClick={handleSave}
        className="w-fit rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? t("emailSettingsSavingEllipsis") : t("emailSettingsSaveButton")}
      </button>
    </div>
  );
}
