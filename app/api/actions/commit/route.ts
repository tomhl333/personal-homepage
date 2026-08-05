import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { commitAction, type ActionRecordInput } from "@/lib/action-records";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { confirmed?: boolean; input?: ActionRecordInput; targetId?: string };
    if (!body.input) return NextResponse.json({ message: "missing_input" }, { status: 400 });
    const result = await commitAction({ authorization: request.headers.get("authorization") ?? "", confirmed: body.confirmed === true, input: body.input, origin: request.nextUrl.origin, targetId: body.targetId });
    return NextResponse.json(withActionPolicy(result), { status: Number(result.status ?? 200), headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "commit_failed";
    return NextResponse.json({ ok: false, message }, { status: message === "explicit_confirmation_required" ? 400 : 500 });
  }
}
