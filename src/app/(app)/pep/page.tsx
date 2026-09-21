import type { Metadata } from "next";
import { PaginationControls } from "@/components/PaginationControls";
import { getPepDesignations, type PepStatus } from "./actions";
import { PepClient } from "./PepClient";

export const metadata: Metadata = { title: "PEP Control — Protegey Partner" };

export default async function PepPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status as PepStatus | undefined;
  const designations = await getPepDesignations({ page, status });
  const href = (nextPage: number) => {
    const query = new URLSearchParams({ page: String(nextPage) });
    if (status) query.set("status", status);
    return `/pep?${query.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PepClient designations={designations.data} initialStatus={status ?? "all"} />
      <PaginationControls page={designations.page} totalPages={designations.totalPages} total={designations.total} href={href} />
    </div>
  );
}
