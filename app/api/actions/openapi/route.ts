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
    // GPT Builder validates 3.1 schemas. Authentication stays in the Builder;
    // the server still enforces it for writes.
    openapi: "3.1.1",
    info: { title: "个人主页维护 Action", version: "1.2.1", description: `Preview and safely maintain the private personal homepage. Server policy ${actionPolicy.version} is authoritative.` },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    paths: {
      "/api/actions/preview": { post: { operationId: "previewPersonalRecord", summary: "Preview a record before writing", requestBody: { required: true, content: { "application/json": { schema: inputSchema } } }, responses: { "200": { description: "Preview result" }, "401": { description: "Unauthorized" } } } },
      "/api/actions/commit": { post: { operationId: "commitPersonalRecord", summary: "Write a confirmed preview", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["confirmed", "input"], properties: { confirmed: { type: "boolean", enum: [true] }, targetId: { type: "string" }, input: inputSchema } } } } }, responses: { "200": { description: "Write and verification result" }, "401": { description: "Unauthorized" }, "409": { description: "Ambiguous; select a candidate" } } } },
      "/actions/status.json": {
        get: {
          operationId: "getPersonalStorageStatus",
          "x-openai-isConsequential": false,
          summary: "Read the authoritative policy version",
          description: "Call before answering. Return policyVersion verbatim.",
          responses: {
            "200": {
              description: "Policy version result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["policyVersion"],
                    additionalProperties: false,
                    properties: { policyVersion: { type: "string", example: actionPolicy.version } },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
