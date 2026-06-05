import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveRemoteImageToGitHub } from "@/lib/github-admin";

export const runtime = "nodejs";

type ITunesResult = {
  artistName?: string;
  artworkUrl100?: string;
  collectionName?: string;
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

  if (!title) {
    return NextResponse.json({ message: "缺少影视名称" }, { status: 400 });
  }

  const search = new URL("https://itunes.apple.com/search");
  search.searchParams.set("term", title);
  search.searchParams.set("country", "HK");
  search.searchParams.set("limit", "8");
  search.searchParams.set("media", body.kind === "电影" ? "movie" : "tvShow");

  try {
    const response = await fetch(search, {
      headers: { "User-Agent": "personal-homepage-admin/1.0" },
    });

    if (!response.ok) {
      return NextResponse.json({ message: "海报查询失败。", poster: "" });
    }

    const data = await response.json();
    const results: ITunesResult[] = Array.isArray(data.results) ? data.results : [];
    const match = results.find((item) => item.artworkUrl100) ?? results[0];

    if (!match?.artworkUrl100) {
      return NextResponse.json({ message: "没有找到海报，可以手动粘贴 URL 或上传图片。", poster: "" });
    }

    const remotePoster = match.artworkUrl100.replace(
      /100x100bb\.(jpg|png|webp)$/i,
      "1000x1500bb.$1",
    );
    const poster = await saveRemoteImageToGitHub({
      title: match.collectionName ?? title,
      uploadDir: body.uploadDir || "/uploads/shows",
      url: remotePoster,
    });

    return NextResponse.json({
      creator: match.artistName ?? "",
      poster,
      remotePoster,
      source: "iTunes Search",
      title: match.collectionName ?? title,
    });
  } catch (error) {
    return NextResponse.json({
      message: error instanceof Error ? error.message : "海报查询失败，可以手动上传。",
      poster: "",
    });
  }
}
