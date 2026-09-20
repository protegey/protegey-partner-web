import type { Metadata } from "next";
import { getCase, getCaseSignalStatus } from "../actions";
import { getTeamMembers } from "../../team/actions";
import { getPartnerSettings } from "../../settings/profile/actions";
import { getSessionUser } from "@/lib/session";
import { CaseDetailClient } from "./CaseDetailClient";

export const metadata: Metadata = {
  title: "Case — Protegey Partner",
};

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [kase, teamMembers, partner, sessionUser, signalStatus] = await Promise.all([
    getCase(id),
    getTeamMembers(),
    getPartnerSettings(),
    getSessionUser(),
    getCaseSignalStatus(id),
  ]);
  const canShareSignal = sessionUser?.permissions.includes("partners.share_fraud_signal") ?? false;

  return (
    <CaseDetailClient
      kase={kase}
      teamMembers={teamMembers}
      sharedSignalsEnabled={partner.sharedSignalsEnabled}
      canShareSignal={canShareSignal}
      initialAlreadyShared={signalStatus.shared}
    />
  );
}
