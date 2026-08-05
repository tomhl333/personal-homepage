import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Transport-only probe for GPT Action diagnostics. It never reads or writes content.
export async function POST(request: NextRequest) {
  if (!isActionRequest(request)) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, policyVersion: actionPolicy.version }, {
    headers: { "Cache-Control": "no-store" },
  });
}
