import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { previewAction, type ActionRecordInput } from "@/lib/action-records";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GPT Action facade: flat query parameters avoid request-body tool translation.
export async function GET(request: NextRequest) {
  if (!isActionRequest(request)) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const title = searchParams.get("title");
  if (!type || !title) {
    return NextResponse.json(withActionPolicy({ ok: false, requiresInput: true, message: "type_and_title_required" }));
  }

  try {
    const input: ActionRecordInput = {
      type: type as ActionRecordInput["type"],
      title,
      note: searchParams.get("note") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    };
    return NextResponse.json(withActionPolicy(await previewAction(input)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "preview_failed" }, { status: 400 });
  }
}
