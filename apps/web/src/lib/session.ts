import { headers } from "next/headers";
import { getAuth } from "./auth";
import { getDb } from "./db";
import { teamMember, eq } from "@socialspark/db";

export async function getSessionOrThrow() {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}

export async function getUserTeam(userId: string) {
  const db = getDb();
  const [membership] = await db
    .select()
    .from(teamMember)
    .where(eq(teamMember.userId, userId))
    .limit(1);

  if (!membership) {
    throw new Response(JSON.stringify({ error: "No team found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return membership;
}
