import { neon } from "@neondatabase/serverless";

let schemaPromise: Promise<void> | null = null;

function sql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  return neon(databaseUrl, { fetchOptions: { cache: "no-store" } });
}

export async function ensurePersonalSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const query = sql();
      await query`CREATE SCHEMA IF NOT EXISTS personal`;
      await query`CREATE TABLE IF NOT EXISTS personal.site_content (
        key TEXT PRIMARY KEY,
        content JSONB NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await query`CREATE TABLE IF NOT EXISTS personal.media_assets (
        id UUID PRIMARY KEY,
        blob_url TEXT NOT NULL UNIQUE,
        pathname TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        record_ref TEXT,
        original_size INTEGER,
        compressed_size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        content_type TEXT NOT NULL DEFAULT 'image/webp',
        status TEXT NOT NULL DEFAULT 'ready',
        starred BOOLEAN NOT NULL DEFAULT FALSE,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived_at TIMESTAMPTZ
      )`;
      await query`CREATE INDEX IF NOT EXISTS media_status_uploaded_idx
        ON personal.media_assets(status, uploaded_at)`;
      await query`CREATE TABLE IF NOT EXISTS personal.action_confirmations (
        api_key_hash TEXT PRIMARY KEY,
        confirmation_token TEXT NOT NULL,
        input JSONB NOT NULL,
        revision INTEGER NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export function personalSql() {
  return sql();
}
