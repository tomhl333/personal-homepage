import crypto from "crypto";
import { del, list, put } from "@vercel/blob";
import sharp from "sharp";
import { ensurePersonalSchema, personalSql } from "@/lib/db";
import { readSiteContent, writeSiteContent } from "@/lib/site-content-store";
import { databaseBudget, enforcePersonalDatabaseBudget } from "@/lib/storage-budget";

const limits: Record<string, { max: number; quality: number }> = {
  handwriting: { max: 2048, quality: 86 },
  books: { max: 900, quality: 82 },
  shows: { max: 1000, quality: 82 },
  default: { max: 1600, quality: 80 },
};

export function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("上传数据格式不正确");
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

function cleanCategory(value: string) {
  return value.replace(/^\/?uploads\/?/, "").replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-") || "misc";
}

export async function compressImage(content: Buffer, category: string) {
  const policy = limits[category] ?? limits.default;
  const result = await sharp(content, { failOn: "none" })
    .rotate()
    .resize({ width: policy.max, height: policy.max, fit: "inside", withoutEnlargement: true })
    .webp({ quality: policy.quality, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: result.data, width: result.info.width, height: result.info.height };
}

export async function storeImage({
  content,
  category: rawCategory,
  title,
  recordRef,
}: {
  content: Buffer;
  category: string;
  title: string;
  recordRef?: string;
}) {
  const category = cleanCategory(rawCategory);
  await enforcePersonalDatabaseBudget();
  const blobBudget = await mediaUsage();
  if (blobBudget.bytes >= blobBudget.limitBytes * Number(process.env.BLOB_STORAGE_STOP_RATIO || 0.8)) {
    throw new Error("blob_free_tier_guard");
  }
  const compressed = await compressImage(content, category);
  const id = crypto.randomUUID();
  const safeTitle = title.normalize("NFKC").replace(/[^\w\u4e00-\u9fff-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  const pathname = `${category}/${new Date().toISOString().slice(0, 10)}/${id}-${safeTitle}.webp`;
  const blob = await put(pathname, compressed.buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
    cacheControlMaxAge: 31_536_000,
  });
  await ensurePersonalSchema();
  const sql = personalSql();
  await sql`INSERT INTO personal.media_assets
    (id, blob_url, pathname, category, record_ref, original_size, compressed_size, width, height)
    VALUES (${id}, ${blob.url}, ${blob.pathname}, ${category}, ${recordRef ?? null}, ${content.length},
      ${compressed.buffer.length}, ${compressed.width}, ${compressed.height})`;
  return { ...blob, id, originalSize: content.length, compressedSize: compressed.buffer.length, width: compressed.width, height: compressed.height };
}

export async function saveRemoteImageToBlob({ title, uploadDir, url }: { title: string; uploadDir: string; url: string }) {
  const hostname = new URL(url).hostname;
  const doubanImage = hostname.endsWith("doubanio.com") || hostname.endsWith("douban.com");
  const response = await fetch(url, { headers: {
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
    "Referer": doubanImage ? "https://www.douban.com/" : "https://personal-homepage-nine-ashen.vercel.app/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0 Safari/537.36",
  } });
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.startsWith("image/")) throw new Error("远程图片无法下载");
  const stored = await storeImage({ content: Buffer.from(await response.arrayBuffer()), category: uploadDir, title });
  return stored.url;
}

export async function mediaUsage() {
  await ensurePersonalSchema();
  const sql = personalSql();
  const rows = await sql`SELECT COUNT(*)::int AS count, COALESCE(SUM(compressed_size),0)::bigint AS bytes
    FROM personal.media_assets WHERE status='ready'`;
  return { count: Number(rows[0]?.count ?? 0), bytes: Number(rows[0]?.bytes ?? 0), limitBytes: Number(process.env.BLOB_STORAGE_LIMIT_BYTES || 1024 ** 3) };
}

export async function storageBudgets() {
  return { blob: await mediaUsage(), database: await databaseBudget() };
}

export async function cleanupMedia({ dryRun = true, targetBytes }: { dryRun?: boolean; targetBytes?: number } = {}) {
  await ensurePersonalSchema();
  const sql = personalSql();
  const usage = await mediaUsage();
  const cleanupTarget = targetBytes ?? Math.floor(usage.limitBytes * Number(process.env.BLOB_CLEANUP_TARGET_RATIO || 0.7));
  const orphanRows = await sql`SELECT id, blob_url, compressed_size FROM personal.media_assets
    WHERE status IN ('orphaned','failed') AND starred=FALSE ORDER BY uploaded_at ASC`;
  const oldRows = usage.bytes > cleanupTarget
    ? await sql`SELECT id, blob_url, compressed_size FROM personal.media_assets
        WHERE status='ready' AND starred=FALSE ORDER BY uploaded_at ASC`
    : [];
  const orphanIds = new Set(orphanRows.map((row) => String(row.id)));
  const candidates = [...orphanRows, ...oldRows.filter((row) => !orphanIds.has(String(row.id)))];
  let projected = usage.bytes;
  const selected: Array<{ id: string; blob_url: string; compressed_size: number }> = [];
  for (const row of candidates) {
    if (projected <= cleanupTarget && !orphanIds.has(String(row.id))) break;
    selected.push(row as typeof selected[number]);
    projected -= Number(row.compressed_size);
  }
  if (!dryRun && selected.length) {
    const ids = selected.map((row) => row.id);
    await sql`UPDATE personal.media_assets SET status='retiring', archived_at=NOW() WHERE id=ANY(${ids}::uuid[])`;
    const removedUrls = new Set(selected.map((row) => row.blob_url));
    const { content, revision } = await readSiteContent();
    const next = structuredClone(content);
    for (const activity of next.activitySpotlights) {
      activity.photos = activity.photos.filter((photo) => !photo.src || !removedUrls.has(photo.src));
      if (activity.checkins) {
        activity.checkins = activity.checkins.map((item) => removedUrls.has(item.src ?? "") ? { ...item, src: undefined } : item);
      }
      if (activity.books) {
        activity.books = activity.books.map((book) => removedUrls.has(book.cover ?? "") ? { ...book, cover: undefined } : book);
      }
      if (activity.shows) {
        activity.shows = activity.shows.map((show) => removedUrls.has(show.poster ?? "") ? { ...show, poster: undefined } : show);
      }
    }
    for (const item of next.galleryItems) {
      item.photos = item.photos.filter((photo) => !photo.src || !removedUrls.has(photo.src));
    }
    await writeSiteContent(next, revision, { bypassBudget: true });
    await del(selected.map((row) => row.blob_url));
    await sql`UPDATE personal.media_assets SET status='deleted' WHERE id=ANY(${ids}::uuid[])`;
  }
  return { ...usage, dryRun, selected: selected.length, projectedBytes: projected };
}

function collectManagedBlobUrls(value: unknown, result = new Set<string>()) {
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      if (url.hostname === "blob.vercel-storage.com" || url.hostname.endsWith(".blob.vercel-storage.com")) {
        result.add(value);
      }
    } catch {
      // Ignore non-URL content strings.
    }
    return result;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectManagedBlobUrls(item, result);
    return result;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectManagedBlobUrls(item, result);
  }
  return result;
}

function duplicateSignature(row: { category: string; pathname: string; compressed_size: number }) {
  const filename = row.pathname.split("/").pop() ?? row.pathname;
  const stableName = filename.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");
  return `${row.category}\u0000${stableName}\u0000${Number(row.compressed_size)}`;
}

export async function cleanupDuplicateMedia({ dryRun = true }: { dryRun?: boolean } = {}) {
  await ensurePersonalSchema();
  const sql = personalSql();
  const stored = await readSiteContent();
  const referencedUrls = collectManagedBlobUrls(stored.content);
  const rows = await sql`SELECT id, blob_url, pathname, category, compressed_size, starred
    FROM personal.media_assets WHERE status='ready' ORDER BY uploaded_at ASC` as Array<{
      id: string;
      blob_url: string;
      pathname: string;
      category: string;
      compressed_size: number;
      starred: boolean;
    }>;
  const referencedSignatures = new Set(
    rows.filter((row) => referencedUrls.has(row.blob_url)).map(duplicateSignature),
  );
  const duplicates = rows.filter((row) =>
    !row.starred
    && row.category !== "training"
    && !referencedUrls.has(row.blob_url)
    && referencedSignatures.has(duplicateSignature(row)),
  );
  const bytes = duplicates.reduce((total, row) => total + Number(row.compressed_size), 0);

  if (!dryRun && duplicates.length) {
    const ids = duplicates.map((row) => row.id);
    await sql`UPDATE personal.media_assets SET status='retiring', archived_at=NOW() WHERE id=ANY(${ids}::uuid[])`;
    await del(duplicates.map((row) => row.blob_url));
    await sql`UPDATE personal.media_assets SET status='deleted' WHERE id=ANY(${ids}::uuid[])`;
  }

  return {
    dryRun,
    duplicates: duplicates.length,
    bytes,
    referenced: referencedUrls.size,
    trainingExcluded: rows.filter((row) => row.category === "training").length,
  };
}

export async function reconcileBlobInventory() {
  let cursor: string | undefined;
  let blobs = 0;
  do {
    const page = await list({ cursor, limit: 1000 });
    blobs += page.blobs.length;
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return { blobs };
}
