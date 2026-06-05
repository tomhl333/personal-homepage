import { NextResponse, type NextRequest } from "next/server";
import localContent from "@/data/site-content.json";
import { isAdminRequest } from "@/lib/admin-auth";
import { readGitHubTextFile, writeGitHubTextFile } from "@/lib/github-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const file = await readGitHubTextFile();

    return NextResponse.json({
      content: JSON.parse(file.content),
      source: "github",
    });
  } catch (error) {
    return NextResponse.json({
      content: localContent,
      message:
        error instanceof Error
          ? `已读取部署内置内容；GitHub 读取失败：${error.message}`
          : "已读取部署内置内容",
      source: "local",
    });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const { content } = (await request.json()) as { content?: unknown };

  if (!content || typeof content !== "object") {
    return NextResponse.json({ message: "内容格式不正确" }, { status: 400 });
  }

  try {
    const formatted = `${JSON.stringify(content, null, 2)}\n`;
    const result = await writeGitHubTextFile({
      content: formatted,
      message: "Update site content from mobile admin",
    });

    return NextResponse.json({
      commit: result.commit?.sha,
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "保存失败",
      },
      { status: 500 },
    );
  }
}
