"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { screenClientAction } from "../actions";

interface ScreeningMatch {
  id: string;
  name: string;
  type: string;
  source: string;
  sourceId: string | null;
  aliases: string[];
  dateOfBirth: string | null;
  nationality: string | null;
  listingDate: string | null;
  notes: string | null;
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

const COUNTRY_FLAGS: Record<string, string> = {
  NG: "\u{1F1F3}\u{1F1EC}", ZA: "\u{1F1FF}\u{1F1E6}", KE: "\u{1F1F0}\u{1F1EA}",
  GH: "\u{1F1EC}\u{1F1ED}", EG: "\u{1F1EA}\u{1F1EC}", US: "\u{1F1FA}\u{1F1F8}",
  GB: "\u{1F1EC}\u{1F1E7}", FR: "\u{1F1EB}\u{1F1F7}", DE: "\u{1F1E9}\u{1F1EA}",
  SA: "\u{1F1F8}\u{1F1E6}", AE: "\u{1F1E6}\u{1F1EA}", IN: "\u{1F1EE}\u{1F1F3}",
  CN: "\u{1F1E8}\u{1F1F3}", RU: "\u{1F1F7}\u{1F1FA}", BR: "\u{1F1E7}\u{1F1F7}",
};

function countryFlag(code: string | null): string {
  if (!code) return "";
  return COUNTRY_FLAGS[code.toUpperCase()] ?? "";
}

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

function MatchCard({ match }: { match: ScreeningMatch }) {
  const [expanded, setExpanded] = useState(false);
  const flag = countryFlag(match.nationality);
  let countryName = match.nationality;
  try {
    if (match.nationality) countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(match.nationality) ?? match.nationality;
  } catch {}

  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{match.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase font-medium">{match.source}</span>
            {match.sourceId && <span>· {match.sourceId}</span>}
            <span>· {(match.score * 100).toFixed(0)}%</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{match.type}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5">
          <div className="grid grid-cols-2 gap-2">
            {match.nationality && (
              <Field label="Nationality" value={<span className="inline-flex items-center gap-1">{flag && <span>{flag}</span>} {countryName}</span>} />
            )}
            {match.dateOfBirth && <Field label="Date of birth" value={match.dateOfBirth} />}
            {match.listingDate && <Field label="Listed on" value={match.listingDate} />}
            {match.aliases.length > 0 && (
              <Field label="Aliases" value={match.aliases.join(", ")} />
            )}
          </div>
          {match.notes && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Notes</p>
              <p className="text-xs text-foreground">{match.notes}</p>
            </div>
          )}
        </div>
      )}
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
      {result.matches.length === 0 ? (
        <p className="text-xs text-muted-foreground">No matches found</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {result.matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ComplianceInfoButton({
  clientId,
  businessName,
}: {
  clientId: string;
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [screeningResult, setScreeningResult] = useState<ScreeningResultSnapshot | null>(null);

  function handleOpen() {
    setOpen(true);
    setLoading(true);
    setError(false);
    screenClientAction(clientId)
      .then(setScreeningResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ShieldCheck className="size-4" />
        See compliance info
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={`Compliance info — ${businessName}`}>
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Checking the sanctions database…</p>
          </div>
        ) : error || !screeningResult ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <ShieldQuestion className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Screening unavailable</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Couldn&apos;t reach the sanctions database right now. Please try again.
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
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {owner.matches.map((m) => (
                        <MatchCard key={m.id} match={m} />
                      ))}
                      {owner.matches.length === 0 && (
                        <p className="text-xs text-muted-foreground">No matches found</p>
                      )}
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
