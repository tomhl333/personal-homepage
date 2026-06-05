import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveRemoteImageToGitHub } from "@/lib/github-admin";

export const runtime = "nodejs";

type OpenLibraryDoc = {
  author_name?: string[];
  cover_i?: number;
  title?: string;
};

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    author?: string;
    title?: string;
    uploadDir?: string;
  };
  const title = body.title?.trim() ?? "";
  const author = body.author?.trim() ?? "";

  if (!title) {
    return NextResponse.json({ message: "缺少书名" }, { status: 400 });
  }

  const search = new URL("https://openlibrary.org/search.json");
  search.searchParams.set("title", title);
  search.searchParams.set("limit", "8");
  search.searchParams.set("fields", "title,author_name,cover_i,key,edition_key,isbn");
  if (author) {
    search.searchParams.set("author", author);
  }

  try {
    const response = await fetch(search, {
      headers: { "User-Agent": "personal-homepage-admin/1.0" },
    });

    if (!response.ok) {
      return NextResponse.json({ cover: "", message: "封面查询失败。" });
    }

    const data = await response.json();
    const docs: OpenLibraryDoc[] = Array.isArray(data.docs) ? data.docs : [];
    const match = docs.find((doc) => doc.cover_i) ?? docs[0];

    if (!match?.cover_i) {
      return NextResponse.json({ cover: "", message: "没有找到封面，可以手动粘贴封面 URL。" });
    }

    const remoteCover = `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`;
    const cover = await saveRemoteImageToGitHub({
      title: `${title}-${match.cover_i}`,
      uploadDir: body.uploadDir || "/uploads/books",
      url: remoteCover,
    });

    return NextResponse.json({
      author: Array.isArray(match.author_name) ? match.author_name[0] : author,
      cover,
      remoteCover,
      source: "Open Library",
      title: match.title ?? title,
    });
  } catch (error) {
    return NextResponse.json({
      cover: "",
      message: error instanceof Error ? error.message : "封面查询失败，可以手动上传。",
    });
  }
}
