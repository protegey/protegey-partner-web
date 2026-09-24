"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldAlert, ShieldX, Loader2, ChevronDown, ChevronRight, UserCog } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import type { StringKey } from "@/lib/i18n/strings";
import { searchSanctionsAction, type SanctionsSearchMatch, type SanctionsSearchResult } from "../actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

const DECISION_CONFIG: Record<string, { key: StringKey; color: string; icon: typeof ShieldCheck }> = {
  blocked: { key: "clientsComplianceDecisionBlocked", color: "text-destructive", icon: ShieldX },
  review: { key: "clientsComplianceDecisionReview", color: "text-amber-600", icon: ShieldAlert },
  clear: { key: "clientsComplianceDecisionClear", color: "text-primary", icon: ShieldCheck },
};

function MatchCard({ match }: { match: SanctionsSearchMatch }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLang();

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{match.name}</p>
            {match.isPep ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600">
                <UserCog className="size-3" />
                {t("sanctionsSearchPepBadge")}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium uppercase">{match.source}</span>
            {match.sourceId ? <span>· {match.sourceId}</span> : null}
            <span>· {(match.score * 100).toFixed(0)}%</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{match.type}</span>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="shrink-0 text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>

      {expanded ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2.5 text-xs">
          {match.nationality ? (
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">{t("clientsComplianceFieldNationality")}</p>
              <p className="text-foreground">{match.nationality}</p>
            </div>
          ) : null}
          {match.dateOfBirth ? (
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">{t("clientsComplianceFieldDob")}</p>
              <p className="text-foreground">{match.dateOfBirth}</p>
            </div>
          ) : null}
          {match.listingDate ? (
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">{t("clientsComplianceFieldListedOn")}</p>
              <p className="text-foreground">{match.listingDate}</p>
            </div>
          ) : null}
          {match.aliases.length > 0 ? (
            <div className="col-span-2">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">{t("clientsComplianceFieldAliases")}</p>
              <p className="text-foreground">{match.aliases.join(", ")}</p>
            </div>
          ) : null}
          {match.notes ? (
            <div className="col-span-2">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">{t("clientsComplianceFieldNotes")}</p>
              <p className="text-foreground">{match.notes}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SanctionsSearchClient() {
  const { t } = useLang();
  const guard = useSessionGuard();
  const [name, setName] = useState("");
  const [type, setType] = useState<"person" | "business">("person");
  const [externalCustomerId, setExternalCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SanctionsSearchResult | null>(null);
  const [searchedName, setSearchedName] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await guard(() => searchSanctionsAction(name.trim(), type, externalCustomerId.trim() || undefined));
      if (response === null) return;
      if (isError(response)) {
        setError(response.error);
        toast.error(response.error);
        return;
      }
      setResult(response);
      setSearchedName(name.trim());
    } catch {
      setError(t("sanctionsSearchError"));
    } finally {
      setLoading(false);
    }
  }

  const decisionConfig = result ? DECISION_CONFIG[result.decision] ?? DECISION_CONFIG.clear : null;
  const DecisionIcon = decisionConfig?.icon;

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link href="/sanctions" className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← {t("navSanctionsList")}
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{t("sanctionsSearchPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("sanctionsSearchPageSubtitle")}</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex min-w-64 flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsSearchNameLabel")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("sanctionsSearchNamePlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsColType")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "person" | "business")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="person">{t("sanctionsTypePerson")}</option>
            <option value="business">{t("sanctionsTypeBusiness")}</option>
          </select>
        </div>
        <div className="flex min-w-48 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsSearchCustomerIdLabel")}</label>
          <input
            value={externalCustomerId}
            onChange={(e) => setExternalCustomerId(e.target.value)}
            placeholder={t("sanctionsSearchCustomerIdPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {t("sanctionsSearchButton")}
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        {externalCustomerId.trim() ? t("sanctionsSearchCustomerIdHintTied") : t("sanctionsSearchCustomerIdHintTransient")}
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {result ? (
        <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("sanctionsSearchResultsForPrefix")}</p>
              <p className="text-lg font-semibold text-foreground">{searchedName}</p>
            </div>
            <div className="flex items-center gap-4">
              {result.pepMatch ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600">
                  <UserCog className="size-3.5" />
                  {t("sanctionsSearchPepMatchFound")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {t("sanctionsSearchNoPepMatch")}
                </span>
              )}
              {decisionConfig && DecisionIcon ? (
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${decisionConfig.color}`}>
                  <DecisionIcon className="size-4" />
                  {t(decisionConfig.key)}
                </span>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("clientsComplianceScoreLabel")} {(result.score * 100).toFixed(0)}%
          </p>

          {result.matches.length === 0 ? (
            <p className="rounded-md border border-border p-4 text-center text-sm text-muted-foreground">{t("clientsComplianceNoMatches")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {result.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
