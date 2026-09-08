const COLUMNS = [
  "Full name",
  "Date / time",
  "Geo location",
  "ID reference",
  "3D liveness",
  "2D reference",
  "Device SDK",
  "Device model",
  "Platform",
  "IP address",
  "Installation ID",
  "Relationship",
];

export function EnrollmentsTable({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{subtitle}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            className="w-64 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            aria-label="From date"
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            aria-label="To date"
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Advanced
          </button>
          <input
            type="text"
            placeholder="Group by..."
            className="w-32 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          0 of 0 shown
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">
                No enrollments yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
