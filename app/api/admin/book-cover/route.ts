import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveRemoteImageToBlob } from "@/lib/blob-media";
import { findBookTitleSuggestion, findWeReadBookSuggestion } from "@/lib/media-title-lookup";

export const runtime = "nodejs";

type GoogleImageLinks = {
  extraLarge?: string;
  large?: string;
  medium?: string;
  small?: string;
  smallThumbnail?: string;
  thumbnail?: string;
};

type GoogleBook = {
  volumeInfo?: {
    authors?: string[];
    imageLinks?: GoogleImageLinks;
    title?: string;
  };
};

type OpenLibraryDoc = {
  author_name?: string[];
  cover_i?: number;
  title?: string;
};

type DoubanBook = {
  author_name?: string;
  id?: string;
  pic?: string;
  title?: string;
  url?: string;
  year?: string;
};

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    author?: string;
    metadataOnly?: boolean;
    title?: string;
    uploadDir?: string;
  };
  const title = body.title?.trim() ?? "";
  const author = body.author?.trim() ?? "";
  const uploadDir = body.uploadDir || "/uploads/books";

  if (!title) {
    return NextResponse.json({ message: "缺少书名" }, { status: 400 });
  }

  try {
    if (body.metadataOnly) {
      const suggestion = await findBookTitleSuggestion(title, author);
      return NextResponse.json({ author: suggestion?.creator ?? author, source: suggestion?.source ?? "", title: suggestion?.title ?? title });
    }
    const douban = await findDoubanBookCover({ author, title, uploadDir }).catch(() => ({ cover: "" }));
    if (douban.cover) return NextResponse.json(douban);

    const weRead = await findWeReadBookCover({ author, title, uploadDir }).catch(() => ({ cover: "" }));
    if (weRead.cover) return NextResponse.json(weRead);

    const google = await findGoogleBookCover({ author, title, uploadDir }).catch(() => ({ cover: "" }));
    if (google.cover) {
      return NextResponse.json(google);
    }

    const openLibrary = await findOpenLibraryCover({ author, title, uploadDir }).catch(() => ({ cover: "" }));
    if (openLibrary.cover) {
      return NextResponse.json(openLibrary);
    }

    return NextResponse.json({
      cover: "",
      message: "豆瓣读书、微信读书、Google Books 和 Open Library 都没有找到封面，可以手动粘贴封面 URL。",
    });
  } catch (error) {
    return NextResponse.json({
      cover: "",
      message: error instanceof Error ? error.message : "封面查询失败，可以手动上传。",
    });
  }
}

async function findWeReadBookCover({ author, title, uploadDir }: { author: string; title: string; uploadDir: string }) {
  const match = await findWeReadBookSuggestion(title, author);
  if (!match?.imageUrl) return { cover: "" };
  const cover = await saveRemoteImageToBlob({ title: match.title, uploadDir, url: match.imageUrl });
  return {
    author: match.creator ?? author,
    cover,
    remoteCover: match.imageUrl,
    source: match.source,
    sourceUrl: match.sourceUrl,
    title: match.title,
  };
}

async function findDoubanBookCover({ author, title, uploadDir }: { author: string; title: string; uploadDir: string }) {
  try {
    let items: DoubanBook[] = [];
    for (const query of [...new Set([[title, author].filter(Boolean).join(" "), title])]) {
      const endpoint = new URL("https://book.douban.com/j/subject_suggest");
      endpoint.searchParams.set("q", query);
      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/json,text/plain,*/*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
          Referer: "https://book.douban.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) continue;
      items = await response.json() as DoubanBook[];
      if (items.some((item) => item.pic)) break;
    }
    const match = items.find((item) => item.title?.trim() === title.trim() && item.pic) ?? items.find((item) => item.pic);
    if (!match?.pic) return { cover: "" };
    const cover = await saveRemoteImageToBlob({ title: match.title ?? title, uploadDir, url: match.pic });
    return { author: match.author_name ?? author, cover, remoteCover: match.pic, source: "豆瓣读书", sourceUrl: match.url, title: match.title ?? title, year: match.year };
  } catch {
    return { cover: "" };
  }
}

async function findGoogleBookCover({
  author,
  title,
  uploadDir,
}: {
  author: string;
  title: string;
  uploadDir: string;
}) {
  const search = new URL("https://www.googleapis.com/books/v1/volumes");
  search.searchParams.set(
    "q",
    [`intitle:${title}`, author ? `inauthor:${author}` : ""]
      .filter(Boolean)
      .join(" "),
  );
  search.searchParams.set("maxResults", "10");
  search.searchParams.set("printType", "books");

  const response = await fetch(search, {
    headers: { "User-Agent": "personal-homepage-admin/1.0" },
  });

  if (!response.ok) {
    return { cover: "" };
  }

  const data = await response.json();
  const books: GoogleBook[] = Array.isArray(data.items) ? data.items : [];
  const match =
    books.find((book) => bestGoogleImage(book.volumeInfo?.imageLinks)) ??
    books[0];
  const remoteCover = bestGoogleImage(match?.volumeInfo?.imageLinks);

  if (!remoteCover) {
    return { cover: "" };
  }

  const cover = await saveRemoteImageToBlob({
    title: match?.volumeInfo?.title ?? title,
    uploadDir,
    url: remoteCover,
  });

  return {
    author: match?.volumeInfo?.authors?.[0] ?? author,
    cover,
    remoteCover,
    source: "Google Books",
    title: match?.volumeInfo?.title ?? title,
  };
}

async function findOpenLibraryCover({
  author,
  title,
  uploadDir,
}: {
  author: string;
  title: string;
  uploadDir: string;
}) {
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
      return { cover: "" };
    }

    const data = await response.json();
    const docs: OpenLibraryDoc[] = Array.isArray(data.docs) ? data.docs : [];
    const match = docs.find((doc) => doc.cover_i) ?? docs[0];

    if (!match?.cover_i) {
      return { cover: "" };
    }

    const remoteCover = `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`;
    const cover = await saveRemoteImageToBlob({
      title: `${title}-${match.cover_i}`,
      uploadDir,
      url: remoteCover,
    });

    return {
      author: Array.isArray(match.author_name) ? match.author_name[0] : author,
      cover,
      remoteCover,
      source: "Open Library",
      title: match.title ?? title,
    };
  } catch {
    return { cover: "" };
  }
}

function bestGoogleImage(imageLinks?: GoogleImageLinks) {
  const url =
    imageLinks?.extraLarge ??
    imageLinks?.large ??
    imageLinks?.medium ??
    imageLinks?.thumbnail ??
    imageLinks?.small ??
    imageLinks?.smallThumbnail;

  if (!url) {
    return "";
  }

  return url.replace(/^http:\/\//i, "https://").replace(/&edge=curl/g, "");
}
