import { createHash } from "crypto";
import type { ActionRecordInput } from "@/lib/action-records";
import { ensurePersonalSchema, personalSql } from "@/lib/db";

function bearerValue(authorization: string) {
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : authorization;
}

function keyHash(authorization: string) {
  return createHash("sha256").update(bearerValue(authorization)).digest("hex");
}

export async function saveActionConfirmation({ authorization, token, input, revision, expiresAt }: {
  authorization: string;
  token: string;
  input: ActionRecordInput;
  revision: number;
  expiresAt: Date;
}) {
  await ensurePersonalSchema();
  const sql = personalSql();
  await sql`INSERT INTO personal.action_confirmations (api_key_hash, confirmation_token, input, revision, expires_at)
    VALUES (${keyHash(authorization)}, ${token}, ${JSON.stringify(input)}::jsonb, ${revision}, ${expiresAt.toISOString()})
    ON CONFLICT (api_key_hash) DO UPDATE SET confirmation_token=EXCLUDED.confirmation_token,
      input=EXCLUDED.input, revision=EXCLUDED.revision, expires_at=EXCLUDED.expires_at, updated_at=NOW()`;
}

export async function loadActionConfirmation(authorization: string) {
  await ensurePersonalSchema();
  const sql = personalSql();
  const rows = await sql`SELECT confirmation_token, input, revision, expires_at
    FROM personal.action_confirmations WHERE api_key_hash=${keyHash(authorization)} AND expires_at > NOW()`;
  const row = rows[0] as { confirmation_token?: string; input?: ActionRecordInput; revision?: number; expires_at?: string } | undefined;
  if (!row?.confirmation_token || !row.input || row.revision === undefined) return undefined;
  return { token: row.confirmation_token, input: row.input, revision: Number(row.revision), expiresAt: new Date(row.expires_at ?? 0) };
}
