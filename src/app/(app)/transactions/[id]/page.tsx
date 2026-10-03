import type { Metadata } from "next";
import { getTransaction } from "../actions";
import { getAlertsForTransaction, getCustomerRuleHistory } from "../../alerts/actions";
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
  // Whether this same customer has triggered the same rule before (partner-scoped — see
  // getCustomerRuleHistory's own doc comment on why externalCustomerId alone isn't enough).
  // Only makes sense when a rule actually fired here, so it's null for a clean transaction.
  const primaryAlert = alerts[0] ?? null;
  const ruleHistory = primaryAlert
    ? await getCustomerRuleHistory(transaction.externalCustomerId, primaryAlert.ruleCode, primaryAlert.id)
    : null;
  const canManage = sessionUser?.permissions.includes("partners.manage_alerts") ?? false;
  const canOpenCase = sessionUser?.permissions.includes("partners.manage_cases") ?? false;

  return (
    <TransactionDetailClient
      transaction={transaction}
      initialAlerts={alerts}
      ruleHistory={ruleHistory}
      teamMembers={teamMembers}
      canManage={canManage}
      canOpenCase={canOpenCase}
    />
  );
}
