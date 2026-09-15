import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Integration Guide — Protegey Partner",
};

export default async function IntegrationGuidePage() {
  const user = await getSessionUser();
  const canManage = user?.permissions.includes("partners.manage_clients") ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integration Guide</h1>
        <p className="text-sm text-muted-foreground">How to use Protegey APIs for KYC verification.</p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">API Authentication</p>
        <p className="text-xs text-muted-foreground">
          Partners obtain an API key via the <a href="/settings" className="text-primary hover:text-primary/90">Settings</a> page.
          The key should be included in the Authorization header as a Bearer token.
        </p>

        <p className="mb-3 text-sm font-semibold text-foreground">KYC Workflow</p>
        <ol className="list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>Partner invitation:</strong> Invite your client using <code>/clients/me</code> endpoint with <code>contactName</code> and <code>contactEmail</code>.
          </li>
          <li>
            <strong>Client form submission:</strong> The client receives an invitation email and completes the KYB form at <code>/client-application/:token</code>.
          </li>
          <li>
            <strong>Automatic screening:</strong> Upon submission, the system automatically screens the business name and beneficial owners against the sanctions list. Results are stored on the submission.
          </li>
          <li>
            <strong>Consultation:</strong> Partners can view screening results in the partner dashboard at <code>/clients/:clientId</code> under <strong>Compliance info</strong>.
          </li>
        </ol>

        <p className="mb-3 text-sm font-semibold text-foreground">Webhook Notifications</p>
        <p className="text-xs text-muted-foreground">
          Partners can configure a webhook URL at <code>/settings</code> to receive signed notifications whenever a KYC session's status changes (e.g., from <code>pending_review</code> to <code>active</code>).
        </p>

        <p className="mb-3 text-sm font-semibold text-foreground">API Endpoints Summary</p>
        <ul className="list-disc text-sm text-muted-foreground space-y-1">
          <li><strong>GET /partners/me</strong>: Partner profile and settings</li>
          <li><code>GET /partners/me/api-credentials</code>: Retrieve API key prefix and creation date</li>
          <li><code>POST /partners/me/api-credentials</code>: Generate a new API key</li>
          <li><code>PATCH /partners/me/api-credentials/webhook</code>: Configure webhook URL for KYC status updates</li>
          <li><code>GET /clients/me</code>: List partner's clients</li>
          <li><code>GET /clients/:clientId</code>: Get client details with screening results</li>
          <li><code>GET /clients/:clientId/screen</code>: Run manual sanctions screening</li>
        </ul>
      </div>
    </div>
  );
}
