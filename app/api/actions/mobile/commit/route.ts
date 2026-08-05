import { NextRequest, NextResponse } from "next/server";
import { internalApiAuthorization, isActionRequest } from "@/lib/admin-auth";
import { verifyActionConfirmation } from "@/lib/action-confirmation";
import { actionAuthLog } from "@/lib/action-mobile";
import { commitAction } from "@/lib/action-records";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authorized = isActionRequest(request);
  actionAuthLog(request, "gpt_action_mobile_commit", authorized);
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  try {
    const token = request.nextUrl.searchParams.get("confirmationToken") ?? "";
    const confirmation = verifyActionConfirmation(token);
    const result = await commitAction({
      authorization: internalApiAuthorization(request.headers.get("authorization") ?? ""),
      confirmed: request.nextUrl.searchParams.get("confirmed") === "true",
      input: confirmation.input,
      origin: request.nextUrl.origin,
      expectedRevision: confirmation.revision,
    });
    return NextResponse.json(withActionPolicy(result), {
      status: Number(result.status ?? 200),
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "commit_failed";
    return NextResponse.json({ ok: false, message }, { status: message === "explicit_confirmation_required" ? 400 : 409 });
  }
}
