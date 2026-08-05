export const dynamic = "force-dynamic";

import { actionPolicy } from "@/lib/action-policy";

const inputSchema = {
  type: "object",
  required: ["type", "title"],
  properties: {
    type: { type: "string", enum: ["show", "book", "activity", "journal"], description: "Named book/show reactions must use book or show, never journal." },
    title: { type: "string", description: "Concise Chinese display title. Remove season suffix from a series title." },
    note: { type: "string", description: "Lightly polished user reflection or summary without inventing facts." },
    date: { type: "string", format: "date" },
    season: { type: "string", description: "For example 第三季; stored as a note type under one canonical series." },
    author: { type: "string" }, creator: { type: "string" }, mediaKind: { type: "string", enum: ["电视剧", "电影", "纪录片", "综艺"] }, status: { type: "string" },
    category: { type: "string", enum: ["练字", "城市生活", "粤语", "网球", "游泳", "健身"] },
    tags: { type: "array", items: { type: "string" } },
    imageUrls: { type: "array", items: { type: "string", format: "uri" }, description: "Only publicly reachable HTTPS image URLs. Chat attachments cannot be invented as URLs." },
    workoutId: { type: "string", description: "Use only after the user selects an ambiguous workout candidate." },
  },
};

export async function GET() {
  return Response.json({
    openapi: "3.1.0",
    info: { title: "个人主页维护 Action", version: "1.1.0", description: `Preview and safely maintain the private personal homepage. Server policy ${actionPolicy.version} is authoritative.` },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    paths: {
      "/api/actions/preview": { post: { operationId: "previewPersonalRecord", summary: "Preview a record and detect duplicates or ambiguity before any write", requestBody: { required: true, content: { "application/json": { schema: inputSchema } } }, responses: { "200": { description: "Preview result" }, "401": { description: "Unauthorized" } } } },
      "/api/actions/commit": { post: { operationId: "commitPersonalRecord", summary: "Write a previously previewed record only after explicit user confirmation", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["confirmed", "input"], properties: { confirmed: { type: "boolean", enum: [true] }, targetId: { type: "string" }, input: inputSchema } } } } }, responses: { "200": { description: "Write and verification result" }, "409": { description: "Ambiguous; select a candidate and retry" } } } },
      "/api/actions/status": { get: { operationId: "getPersonalStorageStatus", summary: "Read the authoritative maintenance policy and Neon/Blob free-tier usage. Call this at the start of a maintenance conversation.", responses: { "200": { description: "Current server policy and storage usage" } } } },
    },
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
