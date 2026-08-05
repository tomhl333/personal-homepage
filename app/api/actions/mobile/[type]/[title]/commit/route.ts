import { NextRequest, NextResponse } from "next/server";
import { internalApiAuthorization, isActionRequest } from "@/lib/admin-auth";
import { mobileActionInput, actionAuthLog } from "@/lib/action-mobile";
import { commitAction } from "@/lib/action-records";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: { type: string; title: string } }) {
  const authorized = isActionRequest(request);
  actionAuthLog(request, "gpt_action_mobile_commit", authorized);
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  const confirmed = request.nextUrl.searchParams.get("confirmed") === "true";
  try {
    const result = await commitAction({
      authorization: internalApiAuthorization(request.headers.get("authorization") ?? ""),
      confirmed,
      input: mobileActionInput(request, context.params.type, context.params.title),
      origin: request.nextUrl.origin,
      targetId: request.nextUrl.searchParams.get("targetId") ?? undefined,
    });
    return NextResponse.json(withActionPolicy(result), {
      status: Number(result.status ?? 200),
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "commit_failed";
    return NextResponse.json({ ok: false, message }, { status: message === "explicit_confirmation_required" ? 400 : 500 });
  }
}
