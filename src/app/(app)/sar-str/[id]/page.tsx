import type { Metadata } from "next";
import { getSarReport, getSarTemplate } from "../actions";
import { getSessionUser } from "@/lib/session";
import { SarReportDetailClient } from "./SarReportDetailClient";

export const metadata: Metadata = {
  title: "SAR/STR Draft — Protegey Partner",
};

export default async function SarReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [report, sessionUser] = await Promise.all([getSarReport(id), getSessionUser()]);
  const template = await getSarTemplate(report.templateId);
  const canSubmit = sessionUser?.permissions.includes("partners.submit_sar") ?? false;

  return <SarReportDetailClient report={report} template={template} canSubmit={canSubmit} />;
}
