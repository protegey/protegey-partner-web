import type { Metadata } from "next";
import { getSarReports, type SarReportStatus } from "./actions";
import { SarStrClient } from "./SarStrClient";

export const metadata: Metadata = {
  title: "SAR/STR — Protegey Partner",
};

export default async function SarStrPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getSarReports({ page, status: status as SarReportStatus | undefined });

  return <SarStrClient result={result} page={page} initialStatus={status ?? "all"} />;
}
