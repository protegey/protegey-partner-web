"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import {
  saveDowJonesCredentialAction,
  deleteDowJonesCredentialAction,
  setScreeningProviderAction,
  type ScreeningProviderStatus,
} from "./actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600",
  unverified: "bg-muted text-muted-foreground",
  invalid: "bg-destructive/15 text-destructive",
  quota_exceeded: "bg-amber-500/15 text-amber-600",
};

export function ScreeningProviderClient({ initialStatus, canManage }: { initialStatus: ScreeningProviderStatus; canManage: boolean }) {
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const [status, setStatus] = useState(initialStatus);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [editingKey, setEditingKey] = useState(!status.credential);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const credentialStatusLabel: Record<string, string> = {
    active: t("screeningProviderStatusActive"),
    unverified: t("screeningProviderStatusUnverified"),
    invalid: t("screeningProviderStatusInvalid"),
    quota_exceeded: t("screeningProviderStatusQuotaExceeded"),
  };

  async function handleSaveKey() {
    if (!apiKey.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await guard(() => saveDowJonesCredentialAction(apiKey.trim(), apiSecret.trim()));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setStatus((prev) => ({
        ...prev,
        credential: { status: "unverified", maskedApiKey: t("screeningProviderKeySavedPlaceholder"), hasApiSecret: Boolean(apiSecret.trim()), lastCheckedAt: null, lastErrorMessage: null },
      }));
      setEditingKey(false);
      setApiKey("");
      setApiSecret("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteKey() {
    setSaving(true);
    setError(null);
    try {
      const result = await guard(() => deleteDowJonesCredentialAction());
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setStatus({ provider: "default", credential: null });
      setEditingKey(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleProvider() {
    const next = status.provider === "default" ? "dow_jones" : "default";
    setToggling(true);
    setError(null);
    try {
      const result = await guard(() => setScreeningProviderAction(next));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setStatus((prev) => ({ ...prev, provider: next }));
    } finally {
      setToggling(false);
    }
  }

  const usingDowJones = status.provider === "dow_jones";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("screeningProviderPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("screeningProviderPageSubtitle")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-2 text-sm font-semibold text-foreground">{t("screeningProviderExplainTitle")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("screeningProviderExplainBody")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{t("screeningProviderCurrentTitle")}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {usingDowJones ? t("screeningProviderDowJones") : t("screeningProviderDefault")}
          </span>
        </div>

        {status.credential ? (
          <div className="mt-3 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status.credential.status]}`}>
              {credentialStatusLabel[status.credential.status]}
            </span>
            {status.credential.lastCheckedAt ? (
              <span className="text-xs text-muted-foreground">
                {t("screeningProviderLastChecked")} {new Date(status.credential.lastCheckedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
              </span>
            ) : null}
          </div>
        ) : null}

        {status.credential?.lastErrorMessage ? (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>{status.credential.lastErrorMessage}</span>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-foreground">{t("screeningProviderToggleLabel")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {status.credential ? t("screeningProviderToggleHint") : t("screeningProviderToggleNeedsKeyHint")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={usingDowJones}
            disabled={!canManage || toggling || !status.credential}
            onClick={handleToggleProvider}
            className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              usingDowJones ? "bg-primary" : "bg-muted"
            }`}
          >
            {toggling ? (
              <Loader2 className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary-foreground" />
            ) : (
              <span className={`inline-block size-4 transform rounded-full bg-background shadow transition-transform ${usingDowJones ? "translate-x-6" : "translate-x-1"}`} />
            )}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("screeningProviderKeyTitle")}</p>

        {status.credential && !editingKey ? (
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-sm text-foreground">{status.credential.maskedApiKey}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canManage}
                onClick={() => setEditingKey(true)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {t("screeningProviderReplaceKey")}
              </button>
              <button
                type="button"
                disabled={!canManage || saving}
                onClick={handleDeleteKey}
                className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {t("screeningProviderRemoveKey")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("screeningProviderApiKeyLabel")}</label>
              <input
                disabled={!canManage}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t("screeningProviderApiKeyPlaceholder")}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("screeningProviderApiSecretLabel")}</label>
              <input
                disabled={!canManage}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={t("screeningProviderApiSecretPlaceholder")}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canManage || saving || !apiKey.trim()}
                onClick={handleSaveKey}
                className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {t("screeningProviderSaveKey")}
              </button>
              {status.credential ? (
                <button
                  type="button"
                  onClick={() => setEditingKey(false)}
                  className="rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t("commonCancel")}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
