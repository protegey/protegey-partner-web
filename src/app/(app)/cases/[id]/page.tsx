import type { Metadata } from "next";
import { getCase } from "../actions";
import { getTeamMembers } from "../../team/actions";
import { CaseDetailClient } from "./CaseDetailClient";

export const metadata: Metadata = {
  title: "Case — Protegey Partner",
};

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [kase, teamMembers] = await Promise.all([getCase(id), getTeamMembers()]);

  return <CaseDetailClient kase={kase} teamMembers={teamMembers} />;
}
