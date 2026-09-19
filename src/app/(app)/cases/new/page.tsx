import type { Metadata } from "next";
import { NewCaseClient } from "./NewCaseClient";

export const metadata: Metadata = {
  title: "New Case — Protegey Partner",
};

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; alertId?: string }>;
}) {
  const { customer, alertId } = await searchParams;
  return <NewCaseClient initialCustomer={customer ?? ""} initialAlertId={alertId ?? ""} />;
}
