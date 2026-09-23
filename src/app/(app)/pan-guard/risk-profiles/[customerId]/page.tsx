import type { Metadata } from "next";
import { getRiskProfileDetail, type EntityRiskProfile } from "../actions";
import { getScreeningMatches } from "../../../sanctions/actions";
import { RiskProfileDetailClient } from "./RiskProfileDetailClient";
import { ApiError } from "@/lib/api";

export const metadata: Metadata = {
  title: "Risk Profile — Protegey Partner",
};

async function loadProfile(externalCustomerId: string): Promise<EntityRiskProfile | null> {
  try {
    return await getRiskProfileDetail(externalCustomerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function RiskProfileDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const externalCustomerId = decodeURIComponent(customerId);
  const [profile, screeningMatchesResult] = await Promise.all([
    loadProfile(externalCustomerId),
    getScreeningMatches({ externalCustomerId, limit: 50 }),
  ]);

  return (
    <RiskProfileDetailClient profile={profile} externalCustomerId={externalCustomerId} screeningMatches={screeningMatchesResult.data} />
  );
}
