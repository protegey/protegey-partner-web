"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";
import { Drawer } from "@/components/Drawer";

interface ScreeningMatch {
  id: string;
  name: string;
  source: string;
  score: number;
  matchedOn: string;
}

interface ScreeningResultEntry {
  decision: "blocked" | "review" | "clear";
  score: number;
  matches: ScreeningMatch[];
}

interface OwnerScreeningResult extends ScreeningResultEntry {
  ownerName: string;
  ownershipPercent: number | null;
}

interface ScreeningResultSnapshot {
  business: ScreeningResultEntry;
  owners: OwnerScreeningResult[];
  screenedAt: string;
}

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

function MatchList({ matches }: { matches: ScreeningMatch[] }) {
  if (matches.length === 0) return <p className="text-xs text-muted-foreground">No matches found</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {matches.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded bg-muted/50 px-2.5 py-1.5 text-xs">
          <span className="font-medium text-foreground">{m.name}</span>
          <span className="text-muted-foreground">
            {(m.score * 100).toFixed(0)}% · {m.source}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScreeningSection({ title, result }: { title: string; result: ScreeningResultEntry }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <DecisionBadge decision={result.decision} />
      </div>
      <p className="text-xs text-muted-foreground">Score: {(result.score * 100).toFixed(0)}%</p>
      <MatchList matches={result.matches} />
    </div>
  );
}

export function ComplianceInfoButton({
  businessName,
  screeningResult,
}: {
  businessName: string;
  screeningResult: ScreeningResultSnapshot | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ShieldCheck className="size-4" />
        See compliance info
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={`Compliance info — ${businessName}`}>
        {!screeningResult ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <ShieldQuestion className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Not yet screened</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Screening will run automatically when the client submits their application.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">
              Screened on {new Date(screeningResult.screenedAt).toLocaleString()}
            </p>

            <ScreeningSection title="Business" result={screeningResult.business} />

            {screeningResult.owners.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Beneficial owners</p>
                {screeningResult.owners.map((owner, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {owner.ownerName}
                        {owner.ownershipPercent != null ? ` — ${owner.ownershipPercent}%` : ""}
                      </span>
                      <DecisionBadge decision={owner.decision} />
                    </div>
                    <p className="text-xs text-muted-foreground">Score: {(owner.score * 100).toFixed(0)}%</p>
                    <div className="mt-1.5">
                      <MatchList matches={owner.matches} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
