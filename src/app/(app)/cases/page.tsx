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
  searchParams: Promise<{ page?: string; status?: string; customer?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_cases", lang);
  if (denied) return denied;

  const { page: pageParam, status, customer } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getCases({ page, status: status as CaseStatus | undefined, externalCustomerId: customer });

  return <CasesClient result={result} page={page} initialStatus={status ?? "all"} initialCustomer={customer ?? ""} />;
}
