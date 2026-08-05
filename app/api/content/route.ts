import { readSiteContent } from "@/lib/site-content-store";
import { mergeTrainingIntoContent } from "@/lib/training-aggregation";

export const dynamic = "force-dynamic";

export async function GET() {
  const stored = await readSiteContent();
  const content = await mergeTrainingIntoContent(stored.content);
  return Response.json({ content, revision: stored.revision, source: stored.source }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
