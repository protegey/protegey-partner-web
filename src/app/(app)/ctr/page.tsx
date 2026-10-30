import type { Metadata } from "next";
import { getCtrReports } from "./actions";
import type { CtrStatus } from "./actions";
import { CtrClient } from "./CtrClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";
export const metadata: Metadata = { title: "CTR — Protegey Partner" };
export default async function CtrPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; currency?: string; periodFrom?: string; periodTo?: string }> }) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_compliance_cases", lang);
  if (denied) return denied;

  const { page: pageParam, status, currency, periodFrom, periodTo } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getCtrReports({ page, status: status as CtrStatus | undefined, currency, periodFrom, periodTo });
  return (
    <CtrClient
      key={`${page}-${status ?? ""}-${currency ?? ""}-${periodFrom ?? ""}-${periodTo ?? ""}`}
      result={result}
      page={page}
      initialStatus={status ?? "all"}
      initialCurrency={currency ?? ""}
      initialPeriodFrom={periodFrom ?? ""}
      initialPeriodTo={periodTo ?? ""}
    />
  );
}
