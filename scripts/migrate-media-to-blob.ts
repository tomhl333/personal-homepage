import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import contentJson from "../data/site-content.json";
import type { SiteContent } from "../data/site";
import { storeImage } from "../lib/blob-media";
import { writeSiteContent } from "../lib/site-content-store";

type MediaRef = { parent: Record<string, unknown>; key: string; source: string };

function collectRefs(value: unknown, refs: MediaRef[] = []): MediaRef[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRefs(item, refs));
  } else if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(object)) {
      if ((key === "src" || key === "cover" || key === "poster") && typeof child === "string" && child.startsWith("/uploads/")) {
        refs.push({ parent: object, key, source: child });
      } else {
        collectRefs(child, refs);
      }
    }
  }
  return refs;
}

async function main() {
  const content = structuredClone(contentJson) as unknown as SiteContent;
  const refs = collectRefs(content);
  const unique = [...new Set(refs.map((ref) => ref.source))];
  const mapping = new Map<string, string>();
  let cursor = 0;

  async function worker() {
    while (cursor < unique.length) {
      const index = cursor++;
      const source = unique[index];
      const localPath = path.join(process.cwd(), "public", ...source.split("/").filter(Boolean));
      const category = source.split("/")[2] || "misc";
      const stored = await storeImage({
        content: await readFile(localPath),
        category,
        title: path.basename(source, path.extname(source)),
      });
      mapping.set(source, stored.url);
      process.stdout.write(`\r${mapping.size}/${unique.length} migrated`);
    }
  }

  await Promise.all(Array.from({ length: 4 }, () => worker()));
  for (const ref of refs) ref.parent[ref.key] = mapping.get(ref.source) ?? ref.source;
  await writeSiteContent(content);
  await writeFile(path.join(process.cwd(), "data", "site-content.json"), `${JSON.stringify(content, null, 2)}\n`, "utf8");
  process.stdout.write(`\nMigrated ${unique.length} unique images and updated Neon content.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
