import { NextRequest, NextResponse } from "next/server";
import { isActionRequest } from "@/lib/admin-auth";
import { actionAuthLog, } from "@/lib/action-mobile";
import { parseTrainingPlanInput, requestTrainingPlan, saveTrainingConfirmation } from "@/lib/training-plan-action";
import { withActionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authorized = isActionRequest(request);
  actionAuthLog(request, "gpt_action_training_plan_preview", authorized);
  if (!authorized) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  try {
    const input = parseTrainingPlanInput(request.nextUrl.searchParams);
    const result = await requestTrainingPlan(`/api/training-plan?equipment=${input.equipmentMode}&minutes=${input.sessionMinutes}&subjectiveState=${input.subjectiveState}&targetFocus=${input.targetFocus}`);
    if (!result.plan?.id) throw new Error("training_plan_missing_id");
    const confirmationToken = await saveTrainingConfirmation(request.headers.get("authorization") ?? "", {
      ...input,
      planId: String(result.plan.id),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    return NextResponse.json(withActionPolicy({ ok: true, action: "preview", confirmationToken, plan: result.plan, message: "训练方案已生成。请确认动作、组数和重量后再写入训记。" }), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "training_plan_preview_failed" }, { status: 400 });
  }
}
