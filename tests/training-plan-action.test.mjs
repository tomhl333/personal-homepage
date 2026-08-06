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
