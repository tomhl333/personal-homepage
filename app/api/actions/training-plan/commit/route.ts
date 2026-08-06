import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { actionAuthLog } from "@/lib/action-mobile";
import { loadTrainingConfirmation, requestTrainingPlan } from "@/lib/training-plan-action";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authorized = isActionRequest(request);
  actionAuthLog(request, "gpt_action_training_plan_commit", authorized);
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  if (request.nextUrl.searchParams.get("confirmed") !== "true") return NextResponse.json({ ok: false, message: "explicit_confirmation_required" }, { status: 400 });
  try {
    const confirmation = await loadTrainingConfirmation(request.headers.get("authorization") ?? "", request.nextUrl.searchParams.get("confirmationToken") ?? undefined);
    if (!confirmation) throw new Error("training_confirmation_required");
    const result = await requestTrainingPlan("/api/training-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...confirmation, planId: confirmation.planId, confirm: true }),
    });
    const succeeded = result.ok === true && result.plan?.status === "succeeded";
    return NextResponse.json(withActionPolicy({ ok: succeeded, saved: succeeded, verified: succeeded, publicVisible: succeeded, ...result, message: succeeded ? "训练方案已写入训记。" : "训衡未返回已写入状态，不能确认完成。" }), { status: succeeded ? 200 : 502, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "training_plan_commit_failed" }, { status: 409 });
  }
}
