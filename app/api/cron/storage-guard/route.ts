import { NextResponse, type NextRequest } from "next/server";
import { cleanupMedia, storageBudgets } from "@/lib/blob-media";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const before = await storageBudgets();
  const cleanup = await cleanupMedia({ dryRun: false });
  const after = await storageBudgets();
  return NextResponse.json({ ok: true, before, cleanup, after });
}
