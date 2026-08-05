import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { cleanupDuplicateMedia, cleanupMedia, reconcileBlobInventory, storageBudgets } from "@/lib/blob-media";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ message: "未登录" }, { status: 401 });
  return NextResponse.json({ usage: await storageBudgets(), inventory: await reconcileBlobInventory() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { confirm?: boolean; duplicates?: boolean };
  if (body.duplicates === true) {
    return NextResponse.json(await cleanupDuplicateMedia({ dryRun: body.confirm !== true }));
  }
  return NextResponse.json(await cleanupMedia({ dryRun: body.confirm !== true }));
}
