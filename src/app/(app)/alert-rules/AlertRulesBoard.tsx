"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, X } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updateAlertRule, deleteAlertRule, type AlertRule, type AlertRuleStatus, type RuleSegment } from "./actions";
import { RuleChatPanel } from "./RuleChatPanel";
import { RuleDialog } from "./RuleDialog";
import { ruleExplanation, ruleName } from "./localize";
import type { StringKey } from "@/lib/i18n/strings";

const SEGMENT_ORDER: RuleSegment[] = ["KYC1", "KYC2", "AGENT", "SUPER_AGENT", "MERCHANT", "CORPORATE", "ALL"];
const SEGMENT_LABEL_KEYS: Record<RuleSegment, StringKey> = {
  KYC1: "segmentKyc1",
  KYC2: "segmentKyc2",
  AGENT: "segmentAgent",
  SUPER_AGENT: "segmentSuperAgent",
  MERCHANT: "segmentMerchant",
  CORPORATE: "segmentCorporate",
  ALL: "segmentAll",
};

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

function StatusPill({ rule, t }: { rule: AlertRule; t: (key: StringKey) => string }) {
  if (rule.status === "draft") {
    return <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600">{t("ruleStatusWaiting")}</span>;
  }
  if (rule.status === "active") {
    return <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{t("ruleStatusOn")}</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{t("ruleStatusOff")}</span>;
}

function RuleCard({
  rule,
  onToggle,
  onOpen,
  onDelete,
  toggling,
  t,
  lang,
}: {
  rule: AlertRule;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
  toggling: boolean;
  t: (key: StringKey) => string;
  lang: "en" | "fr";
}) {
  const sourceLabel = rule.source === "ai_generated" ? t("ruleSourceAi") : rule.source === "manual" ? t("ruleSourceManual") : t("ruleSourceSystem");

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {rule.partnerId !== null ? (
            <button
              type="button"
              onClick={onDelete}
              title={t("ruleDialogDeleteButton")}
              aria-label={t("ruleDialogDeleteButton")}
              className="flex shrink-0 items-center justify-center rounded-md bg-destructive/10 p-2 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-5" />
            </button>
          ) : null}
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">#{rule.ruleNumber}</span>
            <button type="button" onClick={onOpen} className="text-left text-sm font-semibold text-foreground hover:underline">
              {ruleName(rule, lang)}
            </button>
          </div>
        </div>
        <StatusPill rule={rule} t={t} />
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{ruleExplanation(rule, lang)}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{sourceLabel}</span>
        {rule.domain === "identity" ? (
          <span className="rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-300">{t("ruleDomainIdentity")}</span>
        ) : null}
        <span className="text-[11px] font-medium text-foreground">{rule.severity === "block" ? t("ruleOnMatchBlock") : t("ruleOnMatchReview")}</span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={toggling}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            rule.status === "active"
              ? "border border-border text-foreground hover:bg-muted"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {toggling ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {rule.status === "active" ? t("ruleToggleOff") : t("ruleToggleOn")}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onOpen} className="text-xs font-medium text-primary hover:underline">
            {t("ruleEdit")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertRulesBoard({ initialRules }: { initialRules: AlertRule[] }) {
  const guard = useSessionGuard();
  const router = useRouter();
  const { lang, t } = useLang();
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  // Deleting a fork of a system rule should bring the system default back into view — that
  // original row isn't in local state anymore (forking already replaced it), so re-syncing from
  // a fresh server fetch (via router.refresh() below) is the only correct way to show it again.
  useEffect(() => setRules(initialRules), [initialRules]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [confirmToggleRule, setConfirmToggleRule] = useState<AlertRule | null>(null);
  const [confirmDeleteRule, setConfirmDeleteRule] = useState<AlertRule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [justAddedRuleId, setJustAddedRuleId] = useState<string | null>(null);
  const rulesListRef = useRef<HTMLDivElement>(null);
  const justAddedRule = rules.find((r) => r.id === justAddedRuleId) ?? null;
  const [numberSearch, setNumberSearch] = useState("");

  const grouped = useMemo(() => {
    const query = numberSearch.trim();
    const visibleRules = query ? rules.filter((rule) => String(rule.ruleNumber) === query) : rules;
    const bySegment = new Map<RuleSegment, AlertRule[]>();
    for (const rule of visibleRules) {
      const list = bySegment.get(rule.segment) ?? [];
      list.push(rule);
      bySegment.set(rule.segment, list);
    }
    for (const list of bySegment.values()) list.sort((a, b) => a.code.localeCompare(b.code));
    return SEGMENT_ORDER.filter((segment) => bySegment.has(segment)).map((segment) => ({
      segment,
      rules: bySegment.get(segment)!,
    }));
  }, [rules, numberSearch]);

  function replaceRule(updated: AlertRule) {
    setRules((prev) => {
      const withoutOld = prev.filter((r) => r.id !== updated.id && !(r.code === updated.code && r.partnerId === null && updated.partnerId !== null));
      return [...withoutOld, updated];
    });
  }

  /** Rules are sorted alphabetically within their segment, so a freshly generated rule can easily
   * land off-screen — pin a highlighted callout at the very top of the list so it's impossible to miss. */
  function handleRuleGenerated(rule: AlertRule) {
    replaceRule(rule);
    setJustAddedRuleId(rule.id);
    rulesListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleToggle(rule: AlertRule) {
    setTogglingId(rule.id);
    setToggleError(null);
    try {
      const nextStatus: AlertRuleStatus = rule.status === "active" ? "disabled" : "active";
      const result = await guard(() => updateAlertRule(rule.id, { status: nextStatus }));
      if (result === null) return;
      if (isError(result)) {
        setToggleError(result.error);
        toast.error(result.error);
        return;
      }
      replaceRule(result);
      toast.success(nextStatus === "active" ? t("ruleEnabledToast") : t("ruleDisabledToast"));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(rule: AlertRule) {
    setDeletingId(rule.id);
    try {
      const result = await guard(() => deleteAlertRule(rule.id));
      if (result === null) return;
      if (isError(result)) {
        toast.error(result.error);
        return;
      }
      toast.success(t("ruleDeletedToast"));
      setConfirmDeleteRule(null);
      // A fork's deletion falls back to the system default, which isn't in local state anymore
      // (forking already replaced it) — a fresh server fetch is the only correct way to show it
      // again, same as RuleDialog's onDeleted.
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div id="pan-studio" className="scroll-mt-8 lg:h-[calc(100vh-14rem)] lg:sticky lg:top-8">
        <RuleChatPanel onGenerated={handleRuleGenerated} />
      </div>

      <div ref={rulesListRef} className="flex scroll-mt-8 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{t("rulesListTitle")}</p>
          <div className="flex flex-col gap-1">
            <input
              type="number"
              min={1}
              value={numberSearch}
              onChange={(e) => setNumberSearch(e.target.value)}
              placeholder={t("rulesFilterNumberPlaceholder")}
              className="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {justAddedRule ? (
          <div className="flex items-start gap-3 rounded-md border-2 border-primary/40 bg-primary/5 p-3.5">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("ruleJustAddedLabel")}</p>
              <RuleCard
                rule={justAddedRule}
                lang={lang}
                t={t}
                toggling={togglingId === justAddedRule.id}
                onToggle={() => setConfirmToggleRule(justAddedRule)}
                onOpen={() => setEditingRule(justAddedRule)}
                onDelete={() => setConfirmDeleteRule(justAddedRule)}
              />
            </div>
            <button
              type="button"
              onClick={() => setJustAddedRuleId(null)}
              aria-label={t("commonCancel")}
              className="shrink-0 rounded-md p-1 text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        {toggleError ? <p className="text-sm text-destructive">{toggleError}</p> : null}

        {grouped.length === 0 ? (
          <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">{t("rulesListEmpty")}</p>
        ) : (
          grouped.map(({ segment, rules: segmentRules }) => (
            <div key={segment}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(SEGMENT_LABEL_KEYS[segment])}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {segmentRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    lang={lang}
                    t={t}
                    toggling={togglingId === rule.id}
                    onToggle={() => setConfirmToggleRule(rule)}
                    onOpen={() => setEditingRule(rule)}
                    onDelete={() => setConfirmDeleteRule(rule)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {editingRule ? (
        <RuleDialog
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onUpdated={(updated) => {
            replaceRule(updated);
            setEditingRule(updated);
          }}
          onDeleted={() => {
            setEditingRule(null);
            router.refresh();
          }}
        />
      ) : null}

      <ConfirmActionDialog
        open={confirmToggleRule !== null}
        onClose={() => setConfirmToggleRule(null)}
        onConfirm={async () => {
          if (!confirmToggleRule) return;
          await handleToggle(confirmToggleRule);
          setConfirmToggleRule(null);
        }}
        title={confirmToggleRule?.status === "active" ? t("ruleConfirmToggleOffTitle") : t("ruleConfirmToggleOnTitle")}
        description={confirmToggleRule?.status === "active" ? t("ruleConfirmToggleOffDescription") : t("ruleConfirmToggleOnDescription")}
        confirmLabel={confirmToggleRule?.status === "active" ? t("ruleToggleOff") : t("ruleToggleOn")}
        pending={confirmToggleRule ? togglingId === confirmToggleRule.id : false}
      />

      <ConfirmActionDialog
        open={confirmDeleteRule !== null}
        onClose={() => setConfirmDeleteRule(null)}
        onConfirm={async () => {
          if (!confirmDeleteRule) return;
          await handleDelete(confirmDeleteRule);
        }}
        title={t("ruleDeleteConfirmTitle")}
        description={confirmDeleteRule?.code.startsWith("CUSTOM-") ? t("ruleDeleteConfirmDescriptionCustom") : t("ruleDeleteConfirmDescriptionFork")}
        confirmLabel={t("ruleDialogDeleteButton")}
        pendingLabel={t("ruleDeletingEllipsis")}
        pending={confirmDeleteRule ? deletingId === confirmDeleteRule.id : false}
        variant="destructive"
      />
    </div>
  );
}
