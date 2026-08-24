import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveRemoteImageToBlob } from "@/lib/blob-media";
import { findAppleTvSuggestion } from "@/lib/media-title-lookup";

export const runtime = "nodejs";

type ITunesResult = {
  artistName?: string;
  artworkUrl100?: string;
  collectionName?: string;
};

type TmdbResult = {
  id?: number;
  name?: string;
  original_name?: string;
  original_title?: string;
  poster_path?: string;
  title?: string;
};

type DoubanShow = {
  id?: string;
  img?: string;
  pic?: string;
  sub_title?: string;
  title?: string;
  url?: string;
  year?: string;
};

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    kind?: string;
    title?: string;
    uploadDir?: string;
  };
  const title = body.title?.trim() ?? "";
  const kind = body.kind?.trim() ?? "";
  const uploadDir = body.uploadDir || "/uploads/shows";

  if (!title) {
    return NextResponse.json({ message: "缺少影视名称" }, { status: 400 });
  }

  try {
    const douban = await findDoubanPoster({ title, uploadDir }).catch(() => ({ poster: "" }));
    const platform = await findTmdbPlatformForTitle({ kind, title });
    if (douban.poster) return NextResponse.json({ ...douban, platform });

    const tmdb = await findTmdbPoster({ kind, title, uploadDir }).catch(() => ({ poster: "" }));
    if (tmdb.poster) {
      return NextResponse.json({ ...tmdb, platform: ("platform" in tmdb ? tmdb.platform : "") || platform });
    }

    const apple=await findAppleTvSuggestion(title);
    if(apple?.imageUrl){
      try{
        const poster=await saveRemoteImageToBlob({title:apple.title,uploadDir,url:apple.imageUrl});
        return NextResponse.json({poster,remotePoster:apple.imageUrl,source:apple.source,sourceUrl:apple.sourceUrl,title:apple.title,platform:"Apple TV+"});
      }catch{/* Reject placeholders and continue to the next source. */}
    }

    const itunes = await findItunesPoster({ kind, title, uploadDir }).catch(() => ({ poster: "" }));
    if (itunes.poster) {
      return NextResponse.json({ ...itunes, platform });
    }

    return NextResponse.json({
      message: process.env.TMDB_API_KEY
        ? "TMDB 和 iTunes 都没有找到海报，可以手动粘贴 URL 或上传图片。"
        : "没有配置 TMDB_API_KEY，iTunes 也没有找到海报。建议配置 TMDB_API_KEY，或手动粘贴 URL。",
      poster: "",
    });
  } catch (error) {
    return NextResponse.json({
      message: error instanceof Error ? error.message : "海报查询失败，可以手动上传。",
      poster: "",
    });
  }
}

async function findDoubanPoster({ title, uploadDir }: { title: string; uploadDir: string }) {
  try {
    const endpoint = new URL("https://movie.douban.com/j/subject_suggest");
    endpoint.searchParams.set("q", title);
    const response = await fetch(endpoint, {
      headers: { Referer: "https://movie.douban.com/", "User-Agent": "Mozilla/5.0 personal-homepage-cover/2.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { poster: "" };
    const items = await response.json() as DoubanShow[];
    const match = items.find((item) => item.title?.trim() === title.trim() && (item.img || item.pic)) ?? items.find((item) => item.img || item.pic);
    const remotePoster = match?.img || match?.pic;
    if (!match || !remotePoster) return { poster: "" };
    const poster = await saveRemoteImageToBlob({ title: match.title ?? title, uploadDir, url: remotePoster });
    return { creator: "", poster, remotePoster, source: "豆瓣影视", sourceUrl: match.url, title: match.title ?? title, year: match.year, subtitle: match.sub_title };
  } catch {
    return { poster: "" };
  }
}

async function findTmdbPoster({
  kind,
  title,
  uploadDir,
}: {
  kind: string;
  title: string;
  uploadDir: string;
}) {
  const token = process.env.TMDB_API_KEY;
  if (!token) {
    return { poster: "" };
  }

  const searchType = isMovie(kind) ? "movie" : "tv";
  const search = new URL(`https://api.themoviedb.org/3/search/${searchType}`);
  search.searchParams.set("query", title);
  search.searchParams.set("include_adult", "false");
  search.searchParams.set("language", "zh-CN");
  search.searchParams.set("page", "1");

  const response = await fetch(search, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "personal-homepage-admin/1.0",
    },
  });

  if (!response.ok) {
    return { poster: "" };
  }

  const data = await response.json();
  const results: TmdbResult[] = Array.isArray(data.results) ? data.results : [];
  const match = results.find((item) => item.poster_path) ?? results[0];

  if (!match?.poster_path) {
    return { poster: "" };
  }

  const remotePoster = `https://image.tmdb.org/t/p/w780${match.poster_path}`;
  const resolvedTitle =
    match.title ?? match.name ?? match.original_title ?? match.original_name ?? title;
  const poster = await saveRemoteImageToBlob({
    title: resolvedTitle,
    uploadDir,
    url: remotePoster,
  });
  const platform = match.id ? await findTmdbPlatform({ id: match.id, searchType, token }) : "";

  return {
    creator: "",
    poster,
    remotePoster,
    source: "TMDB",
    title: resolvedTitle,
    platform,
  };
}

async function findTmdbPlatformForTitle({ kind, title }: { kind: string; title: string }) {
  const token = process.env.TMDB_API_KEY;
  if (!token) return "";
  try {
    const searchType = isMovie(kind) ? "movie" : "tv";
    const search = new URL(`https://api.themoviedb.org/3/search/${searchType}`);
    search.searchParams.set("query", title);
    search.searchParams.set("language", "zh-CN");
    const response = await fetch(search, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return "";
    const data = await response.json() as { results?: TmdbResult[] };
    const match = data.results?.[0];
    return match?.id ? findTmdbPlatform({ id: match.id, searchType, token }) : "";
  } catch {
    return "";
  }
}

async function findTmdbPlatform({ id, searchType, token }: { id: number; searchType: "movie" | "tv"; token: string }) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/${searchType}/${id}/watch/providers`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "User-Agent": "personal-homepage-admin/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "";
    const data = await response.json() as { results?: Record<string, { flatrate?: Array<{ provider_name?: string }>; buy?: Array<{ provider_name?: string }>; rent?: Array<{ provider_name?: string }> }> };
    const providers = data.results?.CN ?? data.results?.HK ?? data.results?.US;
    return providers?.flatrate?.[0]?.provider_name ?? providers?.buy?.[0]?.provider_name ?? providers?.rent?.[0]?.provider_name ?? "";
  } catch {
    return "";
  }
}

async function findItunesPoster({
  kind,
  title,
  uploadDir,
}: {
  kind: string;
  title: string;
  uploadDir: string;
}) {
  const search = new URL("https://itunes.apple.com/search");
  search.searchParams.set("term", title);
  search.searchParams.set("country", "HK");
  search.searchParams.set("limit", "8");
  search.searchParams.set("media", isMovie(kind) ? "movie" : "tvShow");

  try {
    const response = await fetch(search, {
      headers: { "User-Agent": "personal-homepage-admin/1.0" },
    });

    if (!response.ok) {
      return { poster: "" };
    }

    const data = await response.json();
    const results: ITunesResult[] = Array.isArray(data.results) ? data.results : [];
    const match = results.find((item) => item.artworkUrl100) ?? results[0];

    if (!match?.artworkUrl100) {
      return { poster: "" };
    }

    const remotePoster = match.artworkUrl100.replace(
      /100x100bb\.(jpg|png|webp)$/i,
      "1000x1500bb.$1",
    );
    const poster = await saveRemoteImageToBlob({
      title: match.collectionName ?? title,
      uploadDir,
      url: remotePoster,
    });

    return {
      creator: match.artistName ?? "",
      poster,
      remotePoster,
      source: "iTunes Search",
      title: match.collectionName ?? title,
    };
  } catch {
    return { poster: "" };
  }
}

function isMovie(kind: string) {
  const normalized = kind.toLowerCase();
  return kind === "电影" || normalized.includes("movie") || normalized.includes("film");
}
