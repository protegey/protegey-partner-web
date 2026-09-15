import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";
import type { KycEnrollment, DiditSessionStatus } from "./actions";

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

export function EnrollmentsTable({ enrollments }: { enrollments: KycEnrollment[] }) {
  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Country</th>
            <th className="px-4 py-2.5 font-medium">Liveness score</th>
            <th className="px-4 py-2.5 font-medium">Started</th>
            <th className="px-4 py-2.5 font-medium text-right">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {enrollments.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
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
                <td className="px-4 py-2.5 text-muted-foreground">{e.country ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {e.livenessScore != null ? `${e.livenessScore.toFixed(0)}%` : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
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
