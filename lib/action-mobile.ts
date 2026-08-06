import type { NextRequest } from "next/server";
import type { ActionRecordInput } from "@/lib/action-records";

const validTypes = new Set<ActionRecordInput["type"]>(["book", "show", "activity", "journal"]);

export function mobileActionInput(request: NextRequest, type: string, title: string): ActionRecordInput {
  if (!validTypes.has(type as ActionRecordInput["type"])) throw new Error("invalid_type");
  const query = request.nextUrl.searchParams;
  return {
    type: type as ActionRecordInput["type"],
    title,
    note: query.get("note") ?? undefined,
    date: query.get("date") ?? undefined,
    season: query.get("season") ?? undefined,
    author: query.get("author") ?? undefined,
    creator: query.get("creator") ?? undefined,
    platform: query.get("platform") ?? undefined,
    mediaKind: query.get("mediaKind") ?? undefined,
    status: query.get("status") ?? undefined,
    category: query.get("category") ?? undefined,
    city: query.get("city") ?? undefined,
    paperType: (query.get("paperType") ?? undefined) as ActionRecordInput["paperType"],
    language: (query.get("language") ?? undefined) as ActionRecordInput["language"],
    tags: query.getAll("tag"),
    imageUrls: query.getAll("imageUrl"),
    workoutId: query.get("workoutId") ?? undefined,
  };
}

export function actionAuthLog(request: NextRequest, event: string, authorized: boolean) {
  const authorization = request.headers.get("authorization");
  console.info(JSON.stringify({
    event,
    hasAuthorization: Boolean(authorization),
    bearerFormat: authorization?.startsWith("Bearer ") ?? false,
    authorized,
  }));
}
