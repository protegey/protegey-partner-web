import type { Metadata } from "next";
import { getCtrReports } from "./actions";
import { CtrClient } from "./CtrClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";
export const metadata: Metadata = { title: "CTR — Protegey Partner" };
export default async function CtrPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_compliance_cases", lang);
  if (denied) return denied;

  const { page: pageParam } = await searchParams; const page = Math.max(1, Number(pageParam) || 1);
  return <CtrClient result={await getCtrReports(page)} page={page} />;
}
