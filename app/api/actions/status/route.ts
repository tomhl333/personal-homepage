import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { storageBudgets } from "@/lib/blob-media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, usage: await storageBudgets() }, { headers: { "Cache-Control": "no-store" } });
}
