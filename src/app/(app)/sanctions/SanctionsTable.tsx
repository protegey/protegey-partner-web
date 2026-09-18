import { useLang } from "@/lib/i18n/LangProvider";
import type { SanctionsEntity } from "./actions";

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

function countryName(code: string | null): string {
  if (!code) return "—";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function formatDate(d: string | null): string {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export function SanctionsTable({ sanctions, total }: { sanctions: SanctionsEntity[]; total: number }) {
  const { t } = useLang();
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">{t("sanctionsColName")}</th>
            <th className="px-4 py-2.5 font-medium">{t("sanctionsColAliases")}</th>
            <th className="px-4 py-2.5 font-medium">{t("sanctionsColType")}</th>
            <th className="px-4 py-2.5 font-medium">{t("sanctionsColSource")}</th>
            <th className="px-4 py-2.5 font-medium">{t("clientsComplianceFieldNationality")}</th>
            <th className="px-4 py-2.5 font-medium">{t("sanctionsColListingDate")}</th>
            <th className="px-4 py-2.5 font-medium">{t("clientsComplianceFieldNotes")}</th>
            <th className="px-4 py-2.5 font-medium">{t("sanctionsColStatus")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sanctions.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                {t("sanctionsNoEntries")}
              </td>
            </tr>
          ) : (
            sanctions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2.5 font-medium text-foreground">{s.name}</td>
                <td className="max-w-48 truncate px-4 py-2.5 text-muted-foreground">
                  {s.aliases?.length ? s.aliases.join(", ") : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.type === "person" ? "bg-sky-500/10 text-sky-600" : "bg-purple-500/10 text-purple-600"
                    }`}
                  >
                    {s.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 uppercase text-muted-foreground">{s.source}</td>
                <td className="px-4 py-2.5 text-foreground">
                  {s.nationality ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{countryFlag(s.nationality)}</span>
                      {countryName(s.nationality)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatDate(s.listingDate)}</td>
                <td className="max-w-56 truncate px-4 py-2.5 text-muted-foreground">{s.notes ?? "—"}</td>
                <td className="px-4 py-2.5">
                  {s.delistedAt ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{t("sanctionsDelisted")}</span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t("sanctionsActive")}</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {t("sanctionsShowingPrefix")} {sanctions.length} {t("paginationOf")} {total.toLocaleString()} {t("sanctionsShowingSuffix")}
      </div>
    </div>
  );
}
