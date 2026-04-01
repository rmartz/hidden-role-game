import type { NextRequest } from "next/server";
import { getAdminDatabase } from "@/lib/firebase/admin";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env["CRON_SECRET"];
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = Date.now() - MAX_AGE_MS;
  const db = getAdminDatabase();

  const lobbiesSnap = await db
    .ref("lobbies")
    .orderByChild("public/createdAt")
    .endAt(cutoff)
    .once("value");

  const gamesSnap = await db
    .ref("games")
    .orderByChild("public/createdAt")
    .endAt(cutoff)
    .once("value");

  const updates: Record<string, null> = {};

  lobbiesSnap.forEach((child) => {
    updates[`lobbies/${child.key}`] = null;
  });

  gamesSnap.forEach((child) => {
    updates[`games/${child.key}`] = null;
  });

  const pruned = Object.keys(updates).length;

  if (pruned > 0) {
    await db.ref().update(updates);
  }

  return Response.json({ pruned });
}
