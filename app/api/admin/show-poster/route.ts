import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveRemoteImageToGitHub } from "@/lib/github-admin";

export const runtime = "nodejs";

type ITunesResult = {
  artistName?: string;
  artworkUrl100?: string;
  collectionName?: string;
};

type TmdbResult = {
  name?: string;
  original_name?: string;
  original_title?: string;
  poster_path?: string;
  title?: string;
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
    const tmdb = await findTmdbPoster({ kind, title, uploadDir });
    if (tmdb.poster) {
      return NextResponse.json(tmdb);
    }

    const itunes = await findItunesPoster({ kind, title, uploadDir });
    if (itunes.poster) {
      return NextResponse.json(itunes);
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
  const poster = await saveRemoteImageToGitHub({
    title: resolvedTitle,
    uploadDir,
    url: remotePoster,
  });

  return {
    creator: "",
    poster,
    remotePoster,
    source: "TMDB",
    title: resolvedTitle,
  };
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
    const poster = await saveRemoteImageToGitHub({
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
