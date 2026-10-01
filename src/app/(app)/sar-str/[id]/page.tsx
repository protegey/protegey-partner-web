import type { Metadata } from "next";
import { getSarReport, getSarTemplate } from "../actions";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { SarReportDetailClient } from "./SarReportDetailClient";

export const metadata: Metadata = {
  title: "SAR/STR Draft — Protegey Partner",
};

export default async function SarReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionUser, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(sessionUser, ["partners.manage_compliance_cases", "partners.view_compliance_cases"], lang);
  if (denied) return denied;

  const { id } = await params;
  const report = await getSarReport(id);
  const template = await getSarTemplate(report.templateId);
  const canSubmit = sessionUser?.permissions.includes("partners.submit_sar") ?? false;
  const canManage = sessionUser?.permissions.includes("partners.manage_compliance_cases") ?? false;

  return <SarReportDetailClient report={report} template={template} canSubmit={canSubmit} canManage={canManage} />;
}
