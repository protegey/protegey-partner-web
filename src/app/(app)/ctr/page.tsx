import type { Metadata } from "next";
import { getCtrReports } from "./actions";
import { CtrClient } from "./CtrClient";
export const metadata: Metadata = { title: "CTR — Protegey Partner" };
export default async function CtrPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams; const page = Math.max(1, Number(pageParam) || 1);
  return <CtrClient result={await getCtrReports(page)} page={page} />;
}
