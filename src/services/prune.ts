import { getAdminDatabase } from "@/lib/firebase/admin";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Delete lobbies and games older than 7 days. Returns the count of pruned records. */
export async function pruneStaleRecords(): Promise<number> {
  const cutoff = Date.now() - MAX_AGE_MS;
  const db = getAdminDatabase();

  const [lobbiesSnap, gamesSnap] = await Promise.all([
    db
      .ref("lobbies")
      .orderByChild("public/createdAt")
      .endAt(cutoff)
      .once("value"),
    db
      .ref("games")
      .orderByChild("public/createdAt")
      .endAt(cutoff)
      .once("value"),
  ]);

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

  return pruned;
}
