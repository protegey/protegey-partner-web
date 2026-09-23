import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

/** Authenticated proxy for case evidence downloads — same pattern as `/api/client-documents/[clientId]/download`.
 * The backend never exposes `filePath` (server-only), so this always streams through the API. */
export async function GET(_request: Request, { params }: { params: Promise<{ caseId: string; evidenceId: string }> }) {
  const { caseId, evidenceId } = await params;
  const token = await getAccessToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}/cases/me/${caseId}/evidence/${evidenceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!backendResponse.ok) {
    return new NextResponse(await backendResponse.text(), { status: backendResponse.status });
  }

  return new NextResponse(backendResponse.body, {
    headers: {
      "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": backendResponse.headers.get("Content-Disposition") ?? "attachment",
    },
  });
}
