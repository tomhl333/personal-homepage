import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { createActionConfirmation } from "@/lib/action-confirmation";
import { mobileActionInput, actionAuthLog } from "@/lib/action-mobile";
import { previewAction } from "@/lib/action-records";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: { type: string; title: string } }) {
  const authorized = isActionRequest(request);
  actionAuthLog(request, "gpt_action_mobile_preview", authorized);
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  try {
    const preview = await previewAction(mobileActionInput(request, context.params.type, context.params.title));
    const confirmationToken = preview.requiresChoice ? undefined : createActionConfirmation(preview.input, preview.revision);
    return NextResponse.json(withActionPolicy({ ...preview, confirmationToken }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "preview_failed" }, { status: 400 });
  }
}
