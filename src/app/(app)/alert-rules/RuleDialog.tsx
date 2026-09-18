"use client";

import { useState } from "react";
import { Loader2, Play, Plus, Save, Trash2 } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import {
  updateAlertRule,
  simulateAlertRule,
  type AlertRule,
  type SimulateTransactionInput,
  type SimulationOutcome,
} from "./actions";
import { ruleDescription, ruleName } from "./localize";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

function nowIso(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

function emptyTransaction(index: number): SimulateTransactionInput {
  return {
    externalCustomerId: "sim-customer",
    direction: "DEBIT",
    amount: 0,
    occurredAt: nowIso(index),
  };
}

/**
 * The one place a rule is edited in depth (thresholds + simulate). A modal dialog like every
 * other edit flow in the app — not a full-screen drawer, so it reads as "adjust this one thing"
 * rather than "go do a separate task".
 */
export function RuleDialog({ rule, onClose, onUpdated }: { rule: AlertRule; onClose: () => void; onUpdated: (rule: AlertRule) => void }) {
  const guard = useSessionGuard();
  const { lang, t } = useLang();
  const [parameters, setParameters] = useState<Record<string, number>>(rule.parameters);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<SimulateTransactionInput[]>([emptyTransaction(0), emptyTransaction(1)]);
  const [outcomes, setOutcomes] = useState<SimulationOutcome[] | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  async function handleSaveParameters() {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await guard(() => updateAlertRule(rule.id, { parameters }));
      if (result === null) return;
      if (isError(result)) {
        setSaveError(result.error);
        return;
      }
      onUpdated(result);
    } finally {
      setSaving(false);
    }
  }

  function updateTransaction(index: number, patch: Partial<SimulateTransactionInput>) {
    setTransactions((prev) => prev.map((tItem, i) => (i === index ? { ...tItem, ...patch } : tItem)));
  }

  async function handleSimulate() {
    setSimulating(true);
    setSimError(null);
    setOutcomes(null);
    try {
      const result = await guard(() => simulateAlertRule(rule.id, transactions));
      if (result === null) return;
      if (isError(result)) {
        setSimError(result.error);
        return;
      }
      setOutcomes(result);
    } finally {
      setSimulating(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={`${ruleName(rule, lang)} (${rule.code})`} maxWidthClassName="max-w-2xl" closeAriaLabel={t("close")}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{t("ruleDialogDescriptionLabel")}</p>
          <p className="mt-1 text-sm text-foreground">{ruleDescription(rule, lang)}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">{t("ruleDialogThresholdsTitle")}</p>
          {Object.keys(parameters).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ruleDialogNoThresholds")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(parameters).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-40 shrink-0 text-sm text-foreground">{key}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setParameters((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          )}
          {saveError ? <p className="mt-2 text-sm text-destructive">{saveError}</p> : null}
          <button
            type="button"
            onClick={handleSaveParameters}
            disabled={saving || Object.keys(parameters).length === 0}
            className="mt-3 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? t("ruleDialogSaving") : t("ruleDialogSave")}
          </button>
          {rule.partnerId === null ? <p className="mt-2 text-xs text-muted-foreground">{t("ruleDialogForkNotice")}</p> : null}
        </div>

        <div className="border-t border-border pt-5">
          <p className="mb-1 text-sm font-semibold text-foreground">{t("ruleDialogSimulateTitle")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("ruleDialogSimulateSubtitle")}</p>

          <div className="flex flex-col gap-3">
            {transactions.map((tx, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
                <select
                  value={tx.direction}
                  onChange={(e) => updateTransaction(i, { direction: e.target.value as "DEBIT" | "CREDIT" })}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  <option value="DEBIT">{t("ruleDialogDirectionDebit")}</option>
                  <option value="CREDIT">{t("ruleDialogDirectionCredit")}</option>
                </select>
                <input
                  type="number"
                  placeholder={t("ruleDialogAmountPlaceholder")}
                  value={tx.amount || ""}
                  onChange={(e) => updateTransaction(i, { amount: Number(e.target.value) })}
                  className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                <input
                  type="datetime-local"
                  value={tx.occurredAt.slice(0, 16)}
                  onChange={(e) => updateTransaction(i, { occurredAt: new Date(e.target.value).toISOString() })}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder={t("ruleDialogCounterpartyPlaceholder")}
                  value={tx.counterpartyExternalId ?? ""}
                  onChange={(e) => updateTransaction(i, { counterpartyExternalId: e.target.value || undefined })}
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input type="checkbox" checked={Boolean(tx.isCash)} onChange={(e) => updateTransaction(i, { isCash: e.target.checked })} />
                  {t("ruleDialogCash")}
                </label>
                {outcomes?.[i] ? (
                  <span className={`ml-auto text-xs font-semibold ${outcomes[i].matched ? "text-destructive" : "text-muted-foreground"}`}>
                    {outcomes[i].matched ? t("ruleDialogMatched") : t("ruleDialogNoMatch")}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setTransactions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={t("ruleDialogRemoveAria")}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTransactions((prev) => [...prev, emptyTransaction(prev.length)])}
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="size-3.5" />
              {t("ruleDialogAddTransaction")}
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulating || transactions.length === 0}
              className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {simulating ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              {simulating ? t("ruleDialogRunning") : t("ruleDialogRunSimulation")}
            </button>
          </div>
          {simError ? <p className="mt-2 text-sm text-destructive">{simError}</p> : null}
        </div>
      </div>
    </Dialog>
  );
}
