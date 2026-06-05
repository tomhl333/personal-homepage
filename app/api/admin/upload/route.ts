import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  dataUrlToBuffer,
  normalizeUploadPath,
  writeGitHubBinaryFile,
} from "@/lib/github-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = (await request.json()) as {
    data?: string;
    name?: string;
    uploadDir?: string;
  };

  if (!body.data || !body.name || !body.uploadDir) {
    return NextResponse.json({ message: "缺少上传参数" }, { status: 400 });
  }

  try {
    const { buffer } = dataUrlToBuffer(body.data);
    const { repoPath, src } = normalizeUploadPath(body.uploadDir, body.name);

    await writeGitHubBinaryFile({
      content: buffer,
      message: `Upload ${src} from mobile admin`,
      path: repoPath,
    });

    return NextResponse.json({ ok: true, src });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "上传失败",
      },
      { status: 500 },
    );
  }
}
