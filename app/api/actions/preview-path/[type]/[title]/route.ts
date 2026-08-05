import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { previewAction, type ActionRecordInput } from "@/lib/action-records";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function preview(
  request: NextRequest,
  context: { params: { type: string; title: string } },
) {
  const authorization = request.headers.get("authorization");
  const authorized = isActionRequest(request);
  console.info(JSON.stringify({
    event: "gpt_action_preview_path",
    hasAuthorization: Boolean(authorization),
    bearerFormat: authorization?.startsWith("Bearer ") ?? false,
    authorized,
  }));
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });

  const input: ActionRecordInput = {
    type: context.params.type as ActionRecordInput["type"],
    title: context.params.title,
    note: request.nextUrl.searchParams.get("note") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  };

  try {
    return NextResponse.json(withActionPolicy(await previewAction(input)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "preview_failed" }, { status: 400 });
  }
}

// GPT Builder has demonstrated reliable authenticated POST transport for this
// Action. Keep path inputs so the model need not construct a JSON body.
export async function POST(
  request: NextRequest,
  context: { params: { type: string; title: string } },
) {
  return preview(request, context);
}
