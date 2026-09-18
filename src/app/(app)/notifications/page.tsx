import type { Metadata } from "next";
import { getNotifications, markNotificationsSeen } from "./actions";
import { NotificationsClient } from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Notifications — Protegey Partner",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getNotifications(page);

  // Opening this page is what "reading" your notifications means — mark them seen server-side,
  // right when the data is fetched, so the sidebar badge clears without a separate click.
  await markNotificationsSeen();

  return <NotificationsClient result={result} page={page} />;
}
