"use client";

import { useEffect, useState } from "react";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import type { SiteContent } from "@/data/site";

export function LiveHome({ initialContent }: { initialContent: SiteContent }) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    let active = true;
    fetch(`/api/content?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("content_fetch_failed")))
      .then((result) => { if (active && result.content) setContent(result.content); })
      .catch(() => { /* Keep the server-rendered fallback. */ });
    return () => { active = false; };
  }, []);

  return <main className="min-h-screen overflow-hidden"><Hero content={content}/><Gallery activitySpotlights={content.activitySpotlights}/></main>;
}
