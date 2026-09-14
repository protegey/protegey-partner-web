"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { getKybCompliance } from "./actions";
import type { KybComplianceData } from "./actions";

const DECISION_CONFIG: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  blocked: { label: "Blocked", color: "text-destructive", icon: ShieldX },
  review: { label: "Review required", color: "text-amber-600", icon: ShieldAlert },
  clear: { label: "Clear", color: "text-primary", icon: ShieldCheck },
};

function DecisionBadge({ decision }: { decision: string }) {
  const config = DECISION_CONFIG[decision] ?? DECISION_CONFIG.clear;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.color}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase">{label}</p>
      <p className="text-xs text-foreground">{value}</p>
    </div>
  );
}

function MatchCard({ match }: { match: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const name = String(match["name"] ?? match["subject_name"] ?? "");
  const source = String(match["source"] ?? match["source_name"] ?? "");
  const score = Number(match["match_score"] ?? match["score"] ?? 0);
  const type = String(match["type"] ?? match["fact_type"] ?? "");
  const nationality = String(match["nationality"] ?? "");
  const dateOfBirth = String(match["date_of_birth"] ?? match["dateOfBirth"] ?? "");
  const listingDate = String(match["listed_on"] ?? match["listingDate"] ?? "");
  const aliases = (match["aliases"] as string[]) ?? [];
  const notes = String(match["notes"] ?? "");

  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase font-medium">{source}</span>
            <span>· {(score * 100).toFixed(0)}%</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{type}</span>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>
      {expanded && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5">
          <div className="grid grid-cols-2 gap-2">
            {nationality && <Field label="Nationality" value={nationality} />}
            {dateOfBirth && <Field label="Date of birth" value={dateOfBirth} />}
            {listingDate && <Field label="Listed on" value={listingDate} />}
            {aliases.length > 0 && <Field label="Aliases" value={aliases.join(", ")} />}
          </div>
          {notes && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Notes</p>
              <p className="text-xs text-foreground">{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScreeningSection({ title, result }: { title: string; result: Record<string, unknown> }) {
  const decision = String(result["decision"] ?? result["risk_level"] ?? "");
  const score = Number(result["score"] ?? result["match_score"] ?? 0);
  const matches = (result["matches"] as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <DecisionBadge decision={decision} />
      </div>
      <p className="text-xs text-muted-foreground">Score: {(score * 100).toFixed(0)}%</p>
      {matches.length === 0 ? (
        <p className="text-xs text-muted-foreground">No matches found</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {matches.map((m, i) => (
            <MatchCard key={i} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export function KybComplianceButton({ applicationUuid, businessName }: { applicationUuid: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KybComplianceData | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setLoading(true);
          getKybCompliance(applicationUuid)
            .then((result) => setData(result))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
        }}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ShieldCheck className="size-4" />
        See compliance info
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={`Compliance info — ${businessName}`}>
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading compliance data…</p>
          </div>
        ) : !data?.data ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <ShieldQuestion className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Not yet screened</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Screening will run automatically when the application is reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">
              Screened on {data.screened_at ? new Date(data.screened_at).toLocaleString() : "—"}
            </p>

            <ScreeningSection title="Business" result={data.data} />

            {data.data.pep?.is_pep && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">PEP Screening</p>
                <div className="rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">PEP Match</span>
                    <DecisionBadge decision={data.data.pep!.is_pep ? "review" : "clear"} />
                  </div>
                  {data.data.pep?.designation && (
                    <p className="text-xs text-muted-foreground">Designation: {data.data.pep.designation}</p>
                  )}
                  {(data.data.pep?.matched_designations as Array<Record<string, unknown>>)?.length ? (
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {(data.data.pep.matched_designations as Array<Record<string, unknown>>).map((m, i) => (
                        <MatchCard key={i} match={m} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
