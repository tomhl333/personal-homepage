import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { readSiteContent } from "@/lib/site-content-store";
import { mergeTrainingIntoContent } from "@/lib/training-aggregation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stored = await readSiteContent();
  const content = await mergeTrainingIntoContent(stored.content);
  return (
    <main className="min-h-screen overflow-hidden">
      <Hero content={content} />
      <Gallery activitySpotlights={content.activitySpotlights} />
    </main>
  );
}
