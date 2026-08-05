import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { storageBudgets } from "@/lib/blob-media";
import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    policyVersion: actionPolicy.version,
    policyAuthority: actionPolicy.authority,
    policy: actionPolicy,
    usage: await storageBudgets(),
  }, { headers: { "Cache-Control": "no-store" } });
}
