import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { actionAuthLog } from "@/lib/action-mobile";
import { actionPolicy } from "@/lib/action-policy";
import { storageBudgets } from "@/lib/blob-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorized = isActionRequest(request);
  actionAuthLog(request, "gpt_action_storage_status", authorized);
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, policyVersion: actionPolicy.version, storage: await storageBudgets() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, policyVersion: actionPolicy.version, message: error instanceof Error ? error.message : "storage_status_failed" }, { status: 500 });
  }
}
