import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

/** Public, token-scoped — no session involved, mirrors the public client-applications API. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const backendResponse = await fetch(`${BACKEND_API_URL}/client-applications/${token}/partner-logo`);

  if (!backendResponse.ok) {
    return new NextResponse(await backendResponse.text(), { status: backendResponse.status });
  }

  return new NextResponse(backendResponse.body, {
    headers: {
      "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": backendResponse.headers.get("Content-Disposition") ?? "inline",
    },
  });
}
