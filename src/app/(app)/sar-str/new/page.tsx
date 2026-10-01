import type { Metadata } from "next";
import { getSarTemplates } from "../actions";
import { NewSarReportClient } from "./NewSarReportClient";

export const metadata: Metadata = {
  title: "New SAR/STR — Protegey Partner",
};

export default async function NewSarReportPage({ searchParams }: { searchParams: Promise<{ caseId?: string }> }) {
  const [{ caseId }, templates] = await Promise.all([searchParams, getSarTemplates()]);
  return <NewSarReportClient caseId={caseId ?? ""} templates={templates} />;
}
