import { ensurePersonalSchema, personalSql } from "@/lib/db";

const neonLimitBytes = Number(process.env.NEON_STORAGE_LIMIT_BYTES || 512 * 1024 ** 2);
const neonStopRatio = Number(process.env.NEON_STORAGE_STOP_RATIO || 0.86);

export async function databaseBudget() {
  await ensurePersonalSchema();
  const sql = personalSql();
  const rows = await sql`SELECT pg_database_size(current_database())::bigint AS bytes`;
  const bytes = Number(rows[0]?.bytes ?? 0);
  return {
    bytes,
    limitBytes: neonLimitBytes,
    ratio: bytes / neonLimitBytes,
    stopBytes: Math.floor(neonLimitBytes * neonStopRatio),
  };
}

export async function enforcePersonalDatabaseBudget() {
  const sql = personalSql();
  let usage = await databaseBudget();
  if (usage.ratio >= 0.78) {
    await sql`DELETE FROM personal.media_assets
      WHERE status IN ('deleted','failed','orphaned')
        AND COALESCE(archived_at, uploaded_at) < NOW() - INTERVAL '7 days'`;
    usage = await databaseBudget();
  }
  if (usage.bytes >= usage.stopBytes) {
    throw new Error("database_free_tier_guard");
  }
  return usage;
}
