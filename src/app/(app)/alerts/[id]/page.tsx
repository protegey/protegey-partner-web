import type { Metadata } from "next";
import { getAlert, getCustomerRuleHistory } from "../actions";
import { getTransaction } from "../../transactions/actions";
import { getAssignableTeamMembers } from "../../team/actions";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { AlertDetailClient } from "./AlertDetailClient";

export const metadata: Metadata = {
  title: "Alert Detail — Protegey Partner",
};

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionUser, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(sessionUser, ["partners.manage_alerts", "partners.view_alerts"], lang);
  if (denied) return denied;

  const { id } = await params;
  const [alert, teamMembers] = await Promise.all([getAlert(id), getAssignableTeamMembers("partners.manage_alerts")]);
  const [history, transaction] = await Promise.all([
    getCustomerRuleHistory(alert.externalCustomerId, alert.ruleCode, alert.id),
    alert.transactionId ? getTransaction(alert.transactionId).catch(() => null) : Promise.resolve(null),
  ]);
  const canManage = sessionUser?.permissions.includes("partners.manage_alerts") ?? false;

  return <AlertDetailClient alert={alert} history={history} transaction={transaction} teamMembers={teamMembers} canManage={canManage} />;
}
