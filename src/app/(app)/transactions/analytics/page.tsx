import type { Metadata } from "next";
import { getTransactionStats } from "../actions";
import { AnalyticsCharts } from "./AnalyticsCharts";

export const metadata: Metadata = {
  title: "Transaction Analytics — Protegey Partner",
};

export default async function TransactionAnalyticsPage() {
  const stats = await getTransactionStats();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AnalyticsCharts stats={stats} />
    </div>
  );
}
