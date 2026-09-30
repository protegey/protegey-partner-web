import type { Metadata } from "next";
import { getTransactionStats } from "../actions";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Transaction Analytics — Protegey Partner",
};

export default async function TransactionAnalyticsPage() {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.view_transactions", lang);
  if (denied) return denied;

  const stats = await getTransactionStats();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AnalyticsCharts stats={stats} />
    </div>
  );
}
