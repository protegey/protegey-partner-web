import type { Metadata } from "next";
import { getIntegrationHealth } from "./actions";
import { IntegrationHealthClient } from "./IntegrationHealthClient";

export const metadata: Metadata = {
  title: "Integration Health — Protegey Partner",
};

export default async function IntegrationHealthPage() {
  const report = await getIntegrationHealth();
  return <IntegrationHealthClient report={report} />;
}
