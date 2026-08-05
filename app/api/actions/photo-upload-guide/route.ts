import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { actionAuthLog } from "@/lib/action-mobile";
import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorized = isActionRequest(request);
  actionAuthLog(request, "gpt_action_photo_upload_guide", authorized);
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    policyVersion: actionPolicy.version,
    uploadUrl: `${request.nextUrl.origin}/upload`,
    message: "Upload the original image in the mobile upload page, then paste the returned HTTPS URL here. Chat attachments cannot be transferred to this Action directly.",
  }, { headers: { "Cache-Control": "no-store" } });
}
