import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveRemoteImageToGitHub } from "@/lib/github-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    uploadDir?: string;
    url?: string;
  };

  if (!body.url || !/^https?:\/\//i.test(body.url)) {
    return NextResponse.json({ message: "图片 URL 必须以 http 或 https 开头" }, { status: 400 });
  }

  try {
    const src = await saveRemoteImageToGitHub({
      title: body.title?.trim() || "remote-image",
      uploadDir: body.uploadDir || "/uploads",
      url: body.url,
    });

    return NextResponse.json({ src });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "远程图片保存失败" },
      { status: 502 },
    );
  }
}
