import { createHash, createHmac, timingSafeEqual } from "crypto";
import { ensurePersonalSchema, personalSql } from "@/lib/db";

export const trainingPlanOptions = {
  equipmentMode: ["dumbbell", "free_weights", "gym"] as const,
  sessionMinutes: [30, 45, 60, 75, 90] as const,
  subjectiveState: ["tired", "normal", "good"] as const,
  targetFocus: ["auto", "chest", "back", "shoulders", "legs", "arms"] as const,
};

export type TrainingPlanInput = {
  equipmentMode: typeof trainingPlanOptions.equipmentMode[number];
  sessionMinutes: typeof trainingPlanOptions.sessionMinutes[number];
  subjectiveState: typeof trainingPlanOptions.subjectiveState[number];
  targetFocus: typeof trainingPlanOptions.targetFocus[number];
};

type TrainingConfirmation = TrainingPlanInput & { planId: string; expiresAt: number };

function apiKeyHash(authorization: string) {
  const value = authorization.replace(/^Bearer\s+/i, "");
  return createHash("sha256").update(value).digest("hex");
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.PERSONAL_CONTENT_API_TOKEN || process.env.GPT_ACTION_API_KEY || "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encodeConfirmation(value: TrainingConfirmation) {
  if (!secret()) throw new Error("confirmation_secret_missing");
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function decodeConfirmation(token: string): TrainingConfirmation {
  const [encoded, signature, ...extra] = token.split(".");
  if (!encoded || !signature || extra.length || !secret()) throw new Error("invalid_training_confirmation");
  const expected = sign(encoded);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("invalid_training_confirmation");
  let payload: TrainingConfirmation;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TrainingConfirmation; }
  catch { throw new Error("invalid_training_confirmation"); }
  if (!payload.planId || !Number.isFinite(payload.expiresAt) || payload.expiresAt < Date.now()) throw new Error("expired_training_confirmation");
  return payload;
}

export async function saveTrainingConfirmation(authorization: string, input: TrainingConfirmation) {
  await ensurePersonalSchema();
  const token = encodeConfirmation(input);
  const sql = personalSql();
  await sql`INSERT INTO personal.training_plan_confirmations (api_key_hash, confirmation_token, input, plan_id, expires_at)
    VALUES (${apiKeyHash(authorization)}, ${token}, ${JSON.stringify(input)}::jsonb, ${input.planId}, ${new Date(input.expiresAt).toISOString()})
    ON CONFLICT (api_key_hash) DO UPDATE SET confirmation_token=EXCLUDED.confirmation_token,
      input=EXCLUDED.input, plan_id=EXCLUDED.plan_id, expires_at=EXCLUDED.expires_at, updated_at=NOW()`;
  return token;
}

export async function loadTrainingConfirmation(authorization: string, token?: string) {
  if (token) return decodeConfirmation(token);
  await ensurePersonalSchema();
  const sql = personalSql();
  const rows = await sql`SELECT input, expires_at FROM personal.training_plan_confirmations
    WHERE api_key_hash=${apiKeyHash(authorization)} AND expires_at > NOW()`;
  const value = rows[0]?.input as TrainingConfirmation | undefined;
  if (!value || Number(new Date(rows[0]?.expires_at ?? 0)) < Date.now()) return undefined;
  return value;
}

export function parseTrainingPlanInput(params: URLSearchParams): TrainingPlanInput {
  const equipmentMode = params.get("equipmentMode") as TrainingPlanInput["equipmentMode"];
  const sessionMinutes = Number(params.get("sessionMinutes")) as TrainingPlanInput["sessionMinutes"];
  const subjectiveState = params.get("subjectiveState") as TrainingPlanInput["subjectiveState"];
  const targetFocus = (params.get("targetFocus") || "auto") as TrainingPlanInput["targetFocus"];
  if (!trainingPlanOptions.equipmentMode.includes(equipmentMode) ||
      !trainingPlanOptions.sessionMinutes.includes(sessionMinutes) ||
      !trainingPlanOptions.subjectiveState.includes(subjectiveState) ||
      !trainingPlanOptions.targetFocus.includes(targetFocus)) {
    throw new Error("invalid_training_plan_input");
  }
  return { equipmentMode, sessionMinutes, subjectiveState, targetFocus };
}

export function trainingHomepageAuth() {
  if (process.env.TRAINING_HOMEPAGE_BASIC_AUTH) return process.env.TRAINING_HOMEPAGE_BASIC_AUTH;
  const username = process.env.TRAINING_HOMEPAGE_USERNAME;
  const password = process.env.TRAINING_HOMEPAGE_PASSWORD;
  if (username && password) return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  if (process.env.PERSONAL_CONTENT_API_TOKEN) return `Bearer ${process.env.PERSONAL_CONTENT_API_TOKEN}`;
  throw new Error("training_homepage_auth_not_configured");
}

export function trainingHomepageUrl() {
  return (process.env.TRAINING_HOMEPAGE_URL || "https://xunheng-training.vercel.app").replace(/\/$/, "");
}

export async function requestTrainingPlan(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", trainingHomepageAuth());
  headers.set("Accept", "application/json");
  headers.set("Cache-Control", "no-store");
  const response = await fetch(`${trainingHomepageUrl()}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : `training_plan_http_${response.status}`);
  return body;
}
