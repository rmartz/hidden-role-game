import type { NextRequest } from "next/server";
import { pruneStaleRecords } from "@/services/prune";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env["CRON_SECRET"];
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pruned = await pruneStaleRecords();
  return Response.json({ pruned });
}
