import type { Metadata } from "next";
import { Suspense } from "react";
import { getTransactions } from "./actions";
import type { TransactionDecision, TransactionDirection } from "./actions";
import { TransactionsClient } from "./TransactionsClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Transactions — Protegey Partner",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; direction?: string; decision?: string; customer?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.view_transactions", lang);
  if (denied) return denied;

  const { page: pageParam, direction, decision, customer, dateFrom, dateTo } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getTransactions({
    page,
    direction: direction as TransactionDirection | undefined,
    decision: decision as TransactionDecision | undefined,
    externalCustomerId: customer,
    dateFrom,
    dateTo,
  });

  return (
    <Suspense>
      <TransactionsClient
        result={result}
        page={page}
        initialDirection={direction ?? "all"}
        initialDecision={decision ?? "all"}
        initialCustomer={customer ?? ""}
        initialDateFrom={dateFrom ?? ""}
        initialDateTo={dateTo ?? ""}
      />
    </Suspense>
  );
}
