import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Transport-only probe for GPT Action diagnostics. It never reads or writes content.
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const authorized = isActionRequest(request);

  // Deliberately log only authentication shape, never the credential itself.
  console.info(JSON.stringify({
    event: "gpt_action_ping",
    hasAuthorization: Boolean(authorization),
    bearerFormat: authorization?.startsWith("Bearer ") ?? false,
    authorized,
  }));

  if (!authorized) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, policyVersion: actionPolicy.version }, {
    headers: { "Cache-Control": "no-store" },
  });
}
