import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";
import type { KycEnrollment, DiditSessionStatus } from "./actions";
import { KycDetailButton } from "./KycDetailButton";
import { countryFlag, countryName } from "./country";

const STATUS_CONFIG: Record<DiditSessionStatus, { label: string; color: string; icon: typeof ShieldCheck }> = {
  "Not Started": { label: "Not started", color: "text-muted-foreground", icon: ShieldQuestion },
  "In Progress": { label: "In progress", color: "text-amber-600", icon: ShieldAlert },
  "Awaiting User": { label: "Awaiting user", color: "text-amber-600", icon: ShieldAlert },
  "In Review": { label: "In review", color: "text-amber-600", icon: ShieldAlert },
  Approved: { label: "Approved", color: "text-primary", icon: ShieldCheck },
  Declined: { label: "Declined", color: "text-destructive", icon: ShieldX },
  Resubmitted: { label: "Resubmitted", color: "text-amber-600", icon: ShieldAlert },
  Abandoned: { label: "Abandoned", color: "text-muted-foreground", icon: ShieldX },
  Expired: { label: "Expired", color: "text-muted-foreground", icon: ShieldX },
  "Kyc Expired": { label: "KYC expired", color: "text-destructive", icon: ShieldX },
};

function StatusBadge({ status }: { status: DiditSessionStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["Not Started"];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.color}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function ScoreCell({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  return <span className="text-foreground">{score.toFixed(0)}%</span>;
}

function AmlCell({ riskScore, totalHits }: { riskScore: number | null; totalHits: number | null }) {
  if (!totalHits) return <span className="text-xs text-muted-foreground">Clear</span>;
  const color = (riskScore ?? 0) >= 66 ? "text-destructive" : (riskScore ?? 0) >= 33 ? "text-amber-600" : "text-foreground";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {totalHits} hit{totalHits > 1 ? "s" : ""}
      {riskScore != null ? ` · risk ${riskScore.toFixed(0)}` : ""}
    </span>
  );
}

export function EnrollmentsTable({ enrollments }: { enrollments: KycEnrollment[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Country</th>
            <th className="px-4 py-2.5 font-medium">Document</th>
            <th className="px-4 py-2.5 font-medium">Liveness</th>
            <th className="px-4 py-2.5 font-medium">Face match</th>
            <th className="px-4 py-2.5 font-medium">AML</th>
            <th className="px-4 py-2.5 font-medium">Started</th>
            <th className="px-4 py-2.5 font-medium">Details</th>
            <th className="px-4 py-2.5 font-medium text-right">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {enrollments.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">
                No verification sessions yet.
              </td>
            </tr>
          ) : (
            enrollments.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 font-medium text-foreground">{e.fullName ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-4 py-2.5 text-foreground">
                  {e.country ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{countryFlag(e.country)}</span>
                      {countryName(e.country)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.documentType ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <ScoreCell score={e.livenessScore} />
                </td>
                <td className="px-4 py-2.5">
                  <ScoreCell score={e.faceMatchScore} />
                </td>
                <td className="px-4 py-2.5">
                  <AmlCell riskScore={e.amlRiskScore} totalHits={e.amlTotalHits} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <KycDetailButton enrollmentId={e.id} fullName={e.fullName} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  {e.sessionUrl ? (
                    <a href={e.sessionUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                      Open
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
