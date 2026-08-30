import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("training plan Action exposes preview and commit operations", async () => {
  const openapi = await read("app/api/actions/openapi/route.ts");
  assert.match(openapi, /previewTrainingPlan/);
  assert.match(openapi, /commitTrainingPlan/);
  assert.match(openapi, /equipmentMode/);
  assert.match(openapi, /sessionMinutes/);
  assert.match(openapi, /subjectiveState/);
  assert.match(openapi, /targetFocus/);
});

test("training plan adapter keeps Xunheng behind server-side credentials", async () => {
  const adapter = await read("lib/training-plan-action.ts");
  const commit = await read("app/api/actions/training-plan/commit/route.ts");
  assert.match(adapter, /TRAINING_HOMEPAGE_BASIC_AUTH|TRAINING_HOMEPAGE_USERNAME/);
  assert.match(adapter, /PERSONAL_CONTENT_API_TOKEN/);
  assert.match(adapter, /xunheng-training\.vercel\.app/);
  assert.match(commit, /confirmed.*true/);
  assert.match(commit, /\/api\/training-plan/);
  assert.doesNotMatch(commit, /XUNJI_API_TOKEN/);
});

test("training plan write requires confirmation and plan identity", async () => {
  const route = await read("app/api/actions/training-plan/commit/route.ts");
  assert.match(route, /explicit_confirmation_required/);
  assert.match(route, /confirmationToken/);
  assert.match(route, /planId/);
});

test("homepage only publishes Xunji workouts with real completion evidence", async () => {
  const aggregation = await read("lib/training-aggregation.ts");
  assert.match(aggregation, /isRealXunjiWorkout/);
  assert.match(aggregation, /start_ms,end_ms/);
  assert.match(aggregation, /completed_set_count.*> 0/);
  assert.match(aggregation, /endMs - startMs >= 60_000/);
  assert.match(aggregation, /typeof row\.raw_json === "string"/);
  assert.match(aggregation, /object\(row\.raw_json\)/);
  assert.match(aggregation, /\.filter\(\(row\) => isRealXunjiWorkout\(row\)\)/);
  assert.match(aggregation, /timedOnly/);
  assert.match(aggregation, /完成 \$\{durationMinutes\} 分钟训练/);
  assert.doesNotMatch(aggregation, /if \(flags\.includes\(false\)\) return false/);
});

test("sports preview queries real same-day workout candidates", async () => {
  const [records, openapi, policy] = await Promise.all([
    read("lib/action-records.ts"),
    read("app/api/actions/openapi/route.ts"),
    read("lib/action-policy.ts"),
  ]);
  assert.match(records, /async function workoutCandidatesFor/);
  assert.match(records, /\/api\/workout-media/);
  assert.match(records, /searchParams\.set\("category"/);
  assert.match(records, /category === "网球" \? "tennis"/);
  assert.match(records, /workoutCandidates\.length === 1/);
  assert.match(records, /input\.workoutId = workoutCandidates\[0\]\.id/);
  assert.match(records, /workoutChoiceRequired/);
  assert.match(records, /ok: !ambiguous && !workoutChoiceRequired/);
  assert.match(openapi, /same-day workout candidates/);
  assert.match(policy, /candidate\.id back as workoutId/);
});

test("homepage publishes linked training photos and verifies them after save", async () => {
  const [aggregation, records] = await Promise.all([
    read("lib/training-aggregation.ts"),
    read("lib/action-records.ts"),
  ]);
  assert.match(aggregation, /FROM public\.workout_media/);
  assert.match(aggregation, /workoutsById\.get\(media\.workout_id\)/);
  assert.match(aggregation, /item\.photos = dedupePhotos/);
  assert.match(aggregation, /fitness\.photos = dedupePhotos/);
  assert.match(aggregation, /note: media\.note/);
  assert.match(records, /\/api\/content\?action_verify=/);
  assert.match(records, /imageUrls\.every\(\(url\) => publicContent\.includes\(url\)\)/);
  assert.doesNotMatch(records, /return \{ ok: true, verified: true, publicVisible: true, type: "training-media"/);
});
