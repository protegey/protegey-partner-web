import type { Metadata } from "next";
import { getCases, type CaseStatus } from "./actions";
import { CasesClient } from "./CasesClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Cases — Protegey Partner",
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; customer?: string; caseNumber?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, ["partners.manage_cases", "partners.view_cases"], lang);
  if (denied) return denied;

  const { page: pageParam, status, customer, caseNumber: caseNumberParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const caseNumber = caseNumberParam ? Number(caseNumberParam) : undefined;

  const result = await getCases({ page, status: status as CaseStatus | undefined, externalCustomerId: customer, caseNumber });

  return (
    <CasesClient
      result={result}
      page={page}
      initialStatus={status ?? "all"}
      initialCustomer={customer ?? ""}
      initialCaseNumber={caseNumberParam ?? ""}
    />
  );
}
