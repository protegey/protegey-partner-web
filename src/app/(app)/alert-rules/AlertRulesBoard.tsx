"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, SlidersHorizontal } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { updateAlertRule, type AlertRule, type AlertRuleStatus, type RuleSegment } from "./actions";
import { PanStudioPanel } from "./PanStudioPanel";
import { RuleDrawer } from "./RuleDrawer";

const SEGMENT_ORDER: RuleSegment[] = ["KYC1", "KYC2", "AGENT", "SUPER_AGENT", "MERCHANT", "CORPORATE", "ALL"];
const SEGMENT_LABELS: Record<RuleSegment, string> = {
  KYC1: "KYC1",
  KYC2: "KYC2",
  AGENT: "Agent",
  SUPER_AGENT: "Super Agent",
  MERCHANT: "Merchant",
  CORPORATE: "Corporate",
  ALL: "All segments",
};

const STATUS_CONFIG: Record<AlertRuleStatus, { label: string; color: string; icon: typeof ShieldCheck }> = {
  active: { label: "Active", color: "text-primary", icon: ShieldCheck },
  draft: { label: "Draft", color: "text-amber-600", icon: ShieldQuestion },
  disabled: { label: "Disabled", color: "text-muted-foreground", icon: ShieldAlert },
};

function StatusBadge({ status }: { status: AlertRuleStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.color}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function SourceBadge({ source }: { source: AlertRule["source"] }) {
  const label = source === "ai_generated" ? "Pan-Studio" : source === "manual" ? "Custom" : "System default";
  return <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{label}</span>;
}

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

function RuleRow({ rule, onToggle, onEdit, toggling }: { rule: AlertRule; onToggle: () => void; onEdit: () => void; toggling: boolean }) {
  return (
    <tr>
      <td className="px-4 py-2.5 font-mono text-xs text-foreground">{rule.code}</td>
      <td className="px-4 py-2.5">
        <p className="font-medium text-foreground">{rule.name}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{rule.description}</p>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={rule.status} />
      </td>
      <td className="px-4 py-2.5">
        <span className={`text-xs font-medium ${rule.severity === "block" ? "text-destructive" : "text-foreground"}`}>
          {rule.severity === "block" ? "Block" : "Review"}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <SourceBadge source={rule.source} />
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <SlidersHorizontal className="size-3.5" />
            Edit &amp; simulate
          </button>
          <button
            type="button"
            onClick={onToggle}
            disabled={toggling}
            className="text-xs font-medium text-foreground hover:underline disabled:opacity-50"
          >
            {toggling ? <Loader2 className="size-3.5 animate-spin" /> : rule.status === "active" ? "Disable" : "Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AlertRulesBoard({ initialRules }: { initialRules: AlertRule[] }) {
  const guard = useSessionGuard();
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const grouped = useMemo(() => {
    const bySegment = new Map<RuleSegment, AlertRule[]>();
    for (const rule of rules) {
      const list = bySegment.get(rule.segment) ?? [];
      list.push(rule);
      bySegment.set(rule.segment, list);
    }
    for (const list of bySegment.values()) list.sort((a, b) => a.code.localeCompare(b.code));
    return SEGMENT_ORDER.filter((segment) => bySegment.has(segment)).map((segment) => ({
      segment,
      rules: bySegment.get(segment)!,
    }));
  }, [rules]);

  function replaceRule(updated: AlertRule) {
    setRules((prev) => {
      const withoutOld = prev.filter((r) => r.id !== updated.id && !(r.code === updated.code && r.partnerId === null && updated.partnerId !== null));
      return [...withoutOld, updated];
    });
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
        return;
      }
      replaceRule(result);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PanStudioPanel onGenerated={(rule) => replaceRule(rule)} />

      {toggleError ? <p className="text-sm text-destructive">{toggleError}</p> : null}

      {grouped.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">No alert rules yet.</p>
      ) : (
        grouped.map(({ segment, rules: segmentRules }) => (
          <div key={segment}>
            <p className="mb-2 text-sm font-semibold text-foreground">{SEGMENT_LABELS[segment]}</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Code</th>
                    <th className="px-4 py-2.5 font-medium">Rule</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">On match</th>
                    <th className="px-4 py-2.5 font-medium">Source</th>
                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {segmentRules.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      toggling={togglingId === rule.id}
                      onToggle={() => handleToggle(rule)}
                      onEdit={() => setEditingRule(rule)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {editingRule ? (
        <RuleDrawer
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onUpdated={(updated) => {
            replaceRule(updated);
            setEditingRule(updated);
          }}
        />
      ) : null}
    </div>
  );
}
