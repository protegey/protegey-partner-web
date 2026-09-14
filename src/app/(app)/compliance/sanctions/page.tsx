import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldAlert, Search } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getSanctionsList, type SanctionsListItem } from "../../clients/actions";

export const metadata: Metadata = {
  title: "Sanctions Screening — Protegey Partner",
};

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-destructive/10 text-destructive" },
  high: { label: "High", color: "bg-red-500/10 text-red-600" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-600" },
  low: { label: "Low", color: "bg-primary/10 text-primary" },
};

export default async function SanctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const result = await getSanctionsList({
    status: status ?? undefined,
    page: page ? Number(page) : 1,
    per_page: 20,
  });
  const items: SanctionsListItem[] = result.data ?? [];
  const meta = result.meta;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sanctions Screening</h1>
          <p className="text-sm text-muted-foreground">
            Read-only view of all sanctions screening results. You can view and filter but cannot modify.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <form className="flex items-center gap-2">
          <select name="status" defaultValue={status ?? ""} className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under review</option>
            <option value="more_info_required">More info required</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            <Search className="size-3.5" />
            Filter
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Business</th>
              <th className="px-4 py-2.5 font-medium">Application Status</th>
              <th className="px-4 py-2.5 font-medium">Sanctions</th>
              <th className="px-4 py-2.5 font-medium">PEP</th>
              <th className="px-4 py-2.5 font-medium">Risk Level</th>
              <th className="px-4 py-2.5 font-medium text-right">Screened</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No screening results found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const risk = RISK_CONFIG[item.risk_level] ?? RISK_CONFIG.low;
                return (
                  <tr key={item.application_uuid}>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {item.business_name_screened ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                        {item.application_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {item.is_match ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                          <ShieldAlert className="size-3" />
                          Match
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Clear</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.is_pep ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <ShieldAlert className="size-3" />
                          PEP
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${risk.color}`}>
                        {risk.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {item.screened_at ? new Date(item.screened_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.total > 0 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {meta.current_page} of {meta.last_page} — {meta.total} total
          </p>
          <div className="flex gap-2">
            {meta.current_page > 1 ? (
              <Link
                href={`/compliance/sanctions?page=${meta.current_page - 1}${status ? `&status=${status}` : ""}`}
                className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            ) : (
              <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 py-1.5 opacity-40">
                <ChevronLeft className="size-4" />
                Previous
              </span>
            )}
            {meta.current_page < meta.last_page ? (
              <Link
                href={`/compliance/sanctions?page=${meta.current_page + 1}${status ? `&status=${status}` : ""}`}
                className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
              >
                Next
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 py-1.5 opacity-40">
                Next
                <ChevronRight className="size-4" />
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
