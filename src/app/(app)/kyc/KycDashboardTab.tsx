import type { KycEnrollment } from "./actions";

function countByStatus(enrollments: KycEnrollment[], statuses: string[]): number {
  return enrollments.filter((e) => statuses.includes(e.status)).length;
}

export function KycDashboardTab({ enrollments, total }: { enrollments: KycEnrollment[]; total: number }) {
  const cards = [
    { label: "Total sessions", value: total, accent: "border-t-foreground" },
    { label: "Approved", value: countByStatus(enrollments, ["Approved"]), accent: "border-t-primary" },
    {
      label: "In review",
      value: countByStatus(enrollments, ["In Review", "In Progress", "Awaiting User"]),
      accent: "border-t-amber-500",
    },
    { label: "Declined", value: countByStatus(enrollments, ["Declined", "Abandoned", "Expired"]), accent: "border-t-destructive" },
    { label: "AML flags", value: enrollments.filter((e) => (e.amlTotalHits ?? 0) > 0).length, accent: "border-t-red-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Verification overview</h2>
        <p className="text-sm text-muted-foreground">Identity verification sessions started through Didit.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-md border border-border border-t-2 bg-card p-4 ${card.accent}`}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
