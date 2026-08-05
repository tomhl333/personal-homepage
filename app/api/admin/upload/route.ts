import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { dataUrlToBuffer, storeImage } from "@/lib/blob-media";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    data?: string;
    name?: string;
    uploadDir?: string;
    capturedAt?: string;
  };

  if (!body.data || !body.name || !body.uploadDir) {
    return NextResponse.json({ message: "缺少上传参数" }, { status: 400 });
  }

  try {
    const { buffer } = dataUrlToBuffer(body.data);
    const stored = await storeImage({ content: buffer, category: body.uploadDir, title: body.name, capturedAt: body.capturedAt });

    return NextResponse.json({
      label: body.name.replace(/\.[^.]+$/, ""),
      ok: true,
      src: stored.url,
      compressedSize: stored.compressedSize,
      originalSize: stored.originalSize,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "上传失败",
      },
      { status: 500 },
    );
  }
}
