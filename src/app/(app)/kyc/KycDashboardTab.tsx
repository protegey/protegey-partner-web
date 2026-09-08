const STAT_CARDS = [
  { label: "Total enrolled users", value: "0", accent: "border-t-primary" },
  { label: "Enrollments today", value: "0", accent: "border-t-primary" },
  { label: "Countries covered", value: "0", accent: "border-t-sky-500" },
  { label: "Top platform", value: "—", accent: "border-t-foreground" },
];

export function KycDashboardTab() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Enrollment overview</h2>
        <p className="text-sm text-muted-foreground">
          Snapshot of all users who have completed eKYC enrollment through Pan-ID™.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className={`rounded-md border border-border border-t-2 bg-card p-4 ${card.accent}`}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Enrollment volume over time</p>
          <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
            No enrollment data yet.
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Gender split</p>
          <div className="mt-4 flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Female (0)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-400" /> Male (0)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-foreground" /> Other / Unspecified (0)
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">Enrollments by nationality</p>
        <p className="mt-4 text-center text-sm text-muted-foreground">No data.</p>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-xs font-medium text-muted-foreground">Recent enrollments</p>
          <p className="text-xs text-muted-foreground">Last 10</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Full name</th>
              <th className="px-4 py-2.5 font-medium">Date / time</th>
              <th className="px-4 py-2.5 font-medium">Country</th>
              <th className="px-4 py-2.5 font-medium">Platform</th>
              <th className="px-4 py-2.5 font-medium">Relationship</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                No enrollments yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
