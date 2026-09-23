import type { Metadata } from "next";
import { SanctionsSearchClient } from "./SanctionsSearchClient";

export const metadata: Metadata = {
  title: "Sanctions & PEP Search — Protegey Partner",
};

export default function SanctionsSearchPage() {
  return <SanctionsSearchClient />;
}
