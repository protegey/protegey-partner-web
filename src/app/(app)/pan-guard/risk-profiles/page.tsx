import type { Metadata } from "next";
import { getRiskProfiles } from "./actions";
import { RiskProfilesClient } from "./RiskProfilesClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Risk Profiles — Protegey Partner",
};

export default async function RiskProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; customer?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.view_transactions", lang);
  if (denied) return denied;

  const { page: pageParam, customer } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getRiskProfiles({ page, externalCustomerId: customer });

  return <RiskProfilesClient result={result} page={page} initialCustomer={customer ?? ""} />;
}
