import type { Metadata } from "next";
import { getNotifications, markNotificationsSeen } from "./actions";
import { NotificationsClient } from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Notifications — Protegey Partner",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; actorLabel?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const { page: pageParam, type, actorLabel, dateFrom, dateTo } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getNotifications({ page, type, actorLabel, dateFrom, dateTo });

  // Opening this page is what "reading" your notifications means — mark them seen server-side,
  // right when the data is fetched, so the sidebar badge clears without a separate click.
  await markNotificationsSeen();

  return (
    <NotificationsClient
      key={`${page}-${type ?? ""}-${actorLabel ?? ""}-${dateFrom ?? ""}-${dateTo ?? ""}`}
      result={result}
      page={page}
      initialType={type ?? ""}
      initialActorLabel={actorLabel ?? ""}
      initialDateFrom={dateFrom ?? ""}
      initialDateTo={dateTo ?? ""}
    />
  );
}
