import localContent from "@/data/site-content.json";
import type { SiteContent } from "@/data/site";
import { ensurePersonalSchema, personalSql } from "@/lib/db";
import { enforcePersonalDatabaseBudget } from "@/lib/storage-budget";

const contentKey = "main";

function normalizePaperSection(content: SiteContent) {
  const next = structuredClone(content);
  const section = next.activitySpotlights.find((item) => item.title === "练字");
  if (section) {
    section.title = "纸笔";
    section.summary = section.summary === "慢慢写稳" ? "纸笔慢慢来" : section.summary;
  }
  const voice = next.activitySpotlights.find((item) => item.title === "粤语");
  if (voice) {
    voice.title = "语言学习";
    voice.summary = voice.summary === "每天学一点发音、词汇和场景对话。" ? "记录粤语、西班牙语和其他语言的声音、词汇与表达。" : voice.summary;
  }
  for (const item of next.heroCards) {
    if (item.title === "练字") item.title = "纸笔";
    if (item.title === "粤语") item.title = "语言学习";
  }
  for (const item of next.statusItems) {
    if (item.title === "练字") {
      item.title = "纸笔";
      item.english = "Paper Work";
    }
    if (item.title === "粤语") {
      item.title = "语言学习";
      item.english = "Languages";
    }
  }
  for (const item of next.interests) {
    if (item.title === "练字") {
      item.title = "纸笔";
      item.english = "Paper Work";
    }
    if (item.title === "粤语") {
      item.title = "语言学习";
      item.english = "Languages";
    }
  }
  return next;
}

export async function readSiteContent(): Promise<{ content: SiteContent; revision: number; source: "neon" | "local" }> {
  try {
    await ensurePersonalSchema();
    const sql = personalSql();
    const rows = await sql`SELECT content, revision FROM personal.site_content WHERE key=${contentKey}`;
    if (rows[0]) {
      return { content: normalizePaperSection(rows[0].content as SiteContent), revision: Number(rows[0].revision), source: "neon" };
    }
    await sql`INSERT INTO personal.site_content (key, content) VALUES (${contentKey}, ${JSON.stringify(localContent)}::jsonb)`;
    return { content: normalizePaperSection(localContent as SiteContent), revision: 1, source: "neon" };
  } catch {
    return { content: normalizePaperSection(localContent as SiteContent), revision: 0, source: "local" };
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
