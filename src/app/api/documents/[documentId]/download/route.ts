import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const token = await getAccessToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}/partners/me/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

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
