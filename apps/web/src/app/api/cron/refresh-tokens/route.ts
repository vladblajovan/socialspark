import { NextRequest, NextResponse } from "next/server";
import { refreshExpiringTokens } from "@/lib/platforms/token-refresh";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshExpiringTokens();
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Token refresh cron error:", err);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }
}
