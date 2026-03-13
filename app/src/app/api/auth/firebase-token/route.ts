import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function POST(request: Request): Promise<NextResponse> {
  const sessionId = request.headers.get("x-session-id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  const auth = getAdminAuth();
  const token = await auth.createCustomToken(sessionId, { sessionId });
  return NextResponse.json({ token });
}
