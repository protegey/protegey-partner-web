import type { SanctionsStats } from "./actions";

export function StatsCards({ stats }: { stats: SanctionsStats }) {
  const persons = stats.byType.find((t) => t.type === "person")?.count ?? 0;
  const businesses = stats.byType.find((t) => t.type === "business")?.count ?? 0;

  const cards = [
    { label: "Active", value: stats.active, accent: "border-t-primary" },
    { label: "Delisted", value: stats.delisted, accent: "border-t-muted-foreground" },
    { label: "Persons", value: persons, accent: "border-t-sky-500" },
    { label: "Businesses", value: businesses, accent: "border-t-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-md border border-border border-t-2 bg-card p-4 ${card.accent}`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{card.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
