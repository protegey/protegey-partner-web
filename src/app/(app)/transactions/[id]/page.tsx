import type { Metadata } from "next";
import { getTransaction } from "../actions";
import { getAlertsForTransaction } from "../../alerts/actions";
import { getTeamMembers } from "../../team/actions";
import { getSessionUser } from "@/lib/session";
import { TransactionDetailClient } from "./TransactionDetailClient";

export const metadata: Metadata = {
  title: "Transaction Detail — Protegey Partner",
};

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [transaction, alerts, teamMembers, sessionUser] = await Promise.all([
    getTransaction(id),
    getAlertsForTransaction(id),
    getTeamMembers(),
    getSessionUser(),
  ]);
  const canManage = sessionUser?.permissions.includes("partners.manage_alerts") ?? false;

  return <TransactionDetailClient transaction={transaction} initialAlerts={alerts} teamMembers={teamMembers} canManage={canManage} />;
}
