"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserCog } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import type { StringKey } from "@/lib/i18n/strings";
import { reviewScreeningMatchAction, type ScreeningMatch, type ScreeningMatchStatus } from "../../../sanctions/actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

const STATUS_CONFIG: Record<ScreeningMatchStatus, { key: StringKey; color: string }> = {
  possible_match: { key: "screeningMatchStatusPossible", color: "bg-amber-500/15 text-amber-600" },
  confirmed: { key: "screeningMatchStatusConfirmed", color: "bg-destructive/15 text-destructive" },
  false_positive: { key: "screeningMatchStatusFalsePositive", color: "bg-muted text-muted-foreground" },
  cleared: { key: "screeningMatchStatusCleared", color: "bg-emerald-500/15 text-emerald-600" },
};

/** Durable, per-customer sanctions/PEP matches — unlike the standalone name-search tool, these
 * persist and can be confirmed/dismissed by an analyst (the old platform's "verified by" concept). */
export function ScreeningMatchesSection({
  externalCustomerId,
  initialMatches,
}: {
  externalCustomerId: string;
  initialMatches: ScreeningMatch[];
}) {
  const { t, lang } = useLang();
  const guard = useSessionGuard();
  const [matches, setMatches] = useState(initialMatches);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(id: string, status: Exclude<ScreeningMatchStatus, "possible_match">) {
    setBusyId(id);
    setError(null);
    try {
      const result = await guard(() => reviewScreeningMatchAction(id, status, externalCustomerId));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setMatches((prev) => prev.map((m) => (m.id === id ? result : m)));
    } finally {
      setBusyId(null);
    }
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-1 text-sm font-semibold text-foreground">{t("screeningMatchesTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("screeningMatchesEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{t("screeningMatchesTitle")}</p>
      {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
      <ul className="flex flex-col gap-3">
        {matches.map((match) => {
          const statusConfig = STATUS_CONFIG[match.status];
          const busy = busyId === match.id;
          const reviewed = match.status !== "possible_match";
          return (
            <li key={match.id} className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{match.matchedName}</span>
                  {match.isPep ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600">
                      <UserCog className="size-3" />
                      {t("sanctionsSearchPepBadge")}
                    </span>
                  ) : null}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.color}`}>{t(statusConfig.key)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(match.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium uppercase">{match.source}</span>
                <span>· {t("screeningMatchScoreLabel")} {(match.matchScore * 100).toFixed(0)}%</span>
                <span>· {t("screeningMatchMatchedOnLabel")}: {match.matchedOn}</span>
                {match.verifiedAt ? (
                  <span>· {t("screeningMatchVerifiedAtLabel")} {new Date(match.verifiedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</span>
                ) : null}
              </div>
              {!reviewed ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReview(match.id, "confirmed")}
                    className="flex items-center gap-1.5 rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {t("screeningMatchActionConfirm")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReview(match.id, "false_positive")}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {t("screeningMatchActionFalsePositive")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReview(match.id, "cleared")}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {t("screeningMatchActionClear")}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
