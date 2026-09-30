import type { Metadata } from "next";
import { getTransaction } from "../actions";
import { getAlertsForTransaction } from "../../alerts/actions";
import { getAssignableTeamMembers } from "../../team/actions";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { TransactionDetailClient } from "./TransactionDetailClient";

export const metadata: Metadata = {
  title: "Transaction Detail — Protegey Partner",
};

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionUser, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(sessionUser, "partners.view_transactions", lang);
  if (denied) return denied;

  const { id } = await params;
  const [transaction, alerts, teamMembers] = await Promise.all([
    getTransaction(id),
    getAlertsForTransaction(id),
    getAssignableTeamMembers("partners.manage_alerts"),
  ]);
  const canManage = sessionUser?.permissions.includes("partners.manage_alerts") ?? false;

  return <TransactionDetailClient transaction={transaction} initialAlerts={alerts} teamMembers={teamMembers} canManage={canManage} />;
}
