import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readSiteContent, writeSiteContent } from "@/lib/site-content-store";
import type { SiteContent } from "@/data/site";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    return NextResponse.json(await readSiteContent());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "读取失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const { content, revision } = (await request.json()) as { content?: unknown; revision?: number };

  if (!content || typeof content !== "object") {
    return NextResponse.json({ message: "内容格式不正确" }, { status: 400 });
  }

  try {
    const result = await writeSiteContent(content as SiteContent, revision);
    return NextResponse.json({ ok: true, revision: result.revision });
  } catch (error) {
    const conflict = error instanceof Error && error.message === "content_revision_conflict";
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "保存失败",
      },
      { status: conflict ? 409 : 500 },
    );
  }
}
