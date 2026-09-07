import type { Metadata } from "next";
import { getApplication } from "./actions";
import { ClientApplicationForm } from "./ClientApplicationForm";

export const metadata: Metadata = {
  title: "Business Application",
  description: "Complete your business application.",
};

export default async function ClientApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <p className="max-w-sm rounded-md bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          This application link is invalid — it&apos;s missing a token.
        </p>
      </div>
    );
  }

  const application = await getApplication(token);

  if (!application) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <p className="max-w-sm rounded-md bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          This application link is invalid or has expired.
        </p>
      </div>
    );
  }

  return <ClientApplicationForm token={token} initial={application} />;
}
