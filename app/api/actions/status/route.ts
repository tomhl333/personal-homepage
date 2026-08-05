import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { storageBudgets } from "@/lib/blob-media";
import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authenticated = isActionRequest(request);
    return NextResponse.json({
      ok: true,
      policyVersion: actionPolicy.version,
      policyAuthority: actionPolicy.authority,
      policy: actionPolicy,
      ...(authenticated ? { usage: await storageBudgets() } : {}),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "status_failed" }, { status: 500 });
  }
}
