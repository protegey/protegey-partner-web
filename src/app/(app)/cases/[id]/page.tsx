import type { Metadata } from "next";
import { getCase, getCaseSignalStatus } from "../actions";
import { getTeamMembers } from "../../team/actions";
import { getPartnerSettings } from "../../settings/profile/actions";
import { getDeviceSignals } from "../../pan-guard/device-signals/actions";
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
  const canViewTransactions = sessionUser?.permissions.includes("partners.view_transactions") ?? false;

  // Known devices for this case's customer — offered as an extra identifier in the share dialog,
  // never fetched (or shown) unless the caller already has permission to see device signals.
  const knownDeviceSignals =
    canShareSignal && canViewTransactions ? await getDeviceSignals({ externalCustomerId: kase.externalCustomerId }) : null;
  const knownVisitorIds = [...new Set((knownDeviceSignals?.data ?? []).map((signal) => signal.visitorId).filter((id): id is string => Boolean(id)))];

  return (
    <CaseDetailClient
      kase={kase}
      teamMembers={teamMembers}
      sharedSignalsEnabled={partner.sharedSignalsEnabled}
      canShareSignal={canShareSignal}
      initialAlreadyShared={signalStatus.shared}
      knownVisitorIds={knownVisitorIds}
    />
  );
}
