import { createHmac, timingSafeEqual } from "crypto";
import type { ActionRecordInput } from "@/lib/action-records";

type ConfirmationPayload = {
  exp: number;
  input: ActionRecordInput;
  revision: number;
  version: 1;
};

const confirmationLifetimeMs = 15 * 60 * 1000;

function confirmationSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.PERSONAL_CONTENT_API_TOKEN || process.env.GPT_ACTION_API_KEY || "";
}

function sign(value: string) {
  return createHmac("sha256", confirmationSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createActionConfirmation(input: ActionRecordInput, revision: number) {
  if (!confirmationSecret()) throw new Error("confirmation_secret_missing");
  const payload: ConfirmationPayload = {
    version: 1,
    exp: Date.now() + confirmationLifetimeMs,
    input,
    revision,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyActionConfirmation(token: string): ConfirmationPayload {
  if (!confirmationSecret()) throw new Error("confirmation_secret_missing");
  const [encoded, signature, ...extra] = token.split(".");
  if (!encoded || !signature || extra.length || !safeEqual(signature, sign(encoded))) throw new Error("invalid_confirmation_token");
  let payload: ConfirmationPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ConfirmationPayload;
  } catch {
    throw new Error("invalid_confirmation_token");
  }
  if (payload.version !== 1 || !payload.input || !Number.isFinite(payload.exp) || payload.exp < Date.now()) {
    throw new Error("expired_confirmation_token");
  }
  return payload;
}
