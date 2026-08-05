import localContent from "@/data/site-content.json";
import type { SiteContent } from "@/data/site";
import { ensurePersonalSchema, personalSql } from "@/lib/db";
import { enforcePersonalDatabaseBudget } from "@/lib/storage-budget";

const contentKey = "main";

export async function readSiteContent(): Promise<{ content: SiteContent; revision: number; source: "neon" | "local" }> {
  try {
    await ensurePersonalSchema();
    const sql = personalSql();
    const rows = await sql`SELECT content, revision FROM personal.site_content WHERE key=${contentKey}`;
    if (rows[0]) {
      return { content: rows[0].content as SiteContent, revision: Number(rows[0].revision), source: "neon" };
    }
    await sql`INSERT INTO personal.site_content (key, content) VALUES (${contentKey}, ${JSON.stringify(localContent)}::jsonb)`;
    return { content: localContent as SiteContent, revision: 1, source: "neon" };
  } catch {
    return { content: localContent as SiteContent, revision: 0, source: "local" };
  }
}

export async function writeSiteContent(content: SiteContent, expectedRevision?: number, options: { bypassBudget?: boolean } = {}) {
  await ensurePersonalSchema();
  if (!options.bypassBudget) await enforcePersonalDatabaseBudget();
  const sql = personalSql();
  if (expectedRevision !== undefined) {
    const rows = await sql`UPDATE personal.site_content
      SET content=${JSON.stringify(content)}::jsonb, revision=revision+1, updated_at=NOW()
      WHERE key=${contentKey} AND revision=${expectedRevision}
      RETURNING revision, updated_at`;
    if (!rows[0]) throw new Error("content_revision_conflict");
    return rows[0];
  }
  const rows = await sql`INSERT INTO personal.site_content AS current (key, content, revision)
    VALUES (${contentKey}, ${JSON.stringify(content)}::jsonb, 1)
    ON CONFLICT (key) DO UPDATE SET content=EXCLUDED.content,
      revision=current.revision+1, updated_at=NOW()
    RETURNING revision, updated_at`;
  return rows[0];
}
