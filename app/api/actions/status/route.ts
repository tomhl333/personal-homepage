import { NextResponse } from "next/server";
import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      policyVersion: actionPolicy.version,
      policyAuthority: actionPolicy.authority,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "status_failed" }, { status: 500 });
  }
}
