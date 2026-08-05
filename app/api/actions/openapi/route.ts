export const dynamic = "force-dynamic";

import { actionPolicy } from "@/lib/action-policy";

const jsonObjectResponse = (description: string, properties: Record<string, unknown> = {}) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties,
        additionalProperties: true,
      },
    },
  },
});

const policyProperties = {
  policyVersion: { type: "string", description: "Version of the authoritative server policy used for this result." },
};

const errorProperties = {
  ok: { type: "boolean", enum: [false] },
  message: { type: "string" },
};

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
    info: { title: "个人主页维护 Action", version: "1.1.3", description: `Preview and safely maintain the private personal homepage. Server policy ${actionPolicy.version} is authoritative.` },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    // GPT Builder owns API-key authentication in its editor UI. It still requires
    // components.schemas to be an explicit object when components exists.
    components: { schemas: {} },
    paths: {
      "/api/actions/preview": { post: { operationId: "previewPersonalRecord", summary: "Preview a record and detect duplicates or ambiguity before any write", requestBody: { required: true, content: { "application/json": { schema: inputSchema } } }, responses: { "200": jsonObjectResponse("Preview result", { ok: { type: "boolean" }, action: { type: "string" }, requiresChoice: { type: "boolean" }, candidates: { type: "array", items: { type: "object", additionalProperties: true } }, input: inputSchema, revision: { type: "string" }, message: { type: "string" }, ...policyProperties }), "400": jsonObjectResponse("Invalid preview input", errorProperties), "401": jsonObjectResponse("Unauthorized", errorProperties) } } },
      "/api/actions/commit": { post: { operationId: "commitPersonalRecord", summary: "Write a previously previewed record only after explicit user confirmation", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["confirmed", "input"], properties: { confirmed: { type: "boolean", enum: [true] }, targetId: { type: "string" }, input: inputSchema } } } } }, responses: { "200": jsonObjectResponse("Write and verification result", { ok: { type: "boolean" }, saved: { type: "boolean" }, verified: { type: "boolean" }, publicVisible: { type: "boolean" }, message: { type: "string" }, ...policyProperties }), "400": jsonObjectResponse("Missing input or explicit confirmation", errorProperties), "401": jsonObjectResponse("Unauthorized", errorProperties), "409": jsonObjectResponse("Ambiguous; select a candidate and retry", { ok: { type: "boolean" }, requiresChoice: { type: "boolean" }, candidates: { type: "array", items: { type: "object", additionalProperties: true } }, message: { type: "string" }, ...policyProperties }), "500": jsonObjectResponse("Commit failed", errorProperties) } } },
      "/api/actions/status": { get: { operationId: "getPersonalStorageStatus", summary: "MUST call this endpoint for every maintenance conversation before answering. Never guess or answer a policyVersion from memory.", description: "This is the authoritative server status. Invoke it before replying to any request about homepage storage, policy, or maintenance. Return the exact top-level policyVersion from the response verbatim. If the call fails, report the failure and do not invent a version.", responses: { "200": jsonObjectResponse("Current server policy and storage usage", { ok: { type: "boolean", example: true }, policyVersion: { type: "string", example: actionPolicy.version, description: "Exact authoritative policy version. Return this string verbatim." }, policyAuthority: { type: "string", example: actionPolicy.authority }, policy: { type: "object", required: ["version", "authority", "summary", "rules"], properties: { version: { type: "string", example: actionPolicy.version }, authority: { type: "string" }, summary: { type: "string" }, rules: { type: "array", items: { type: "string" } } }, additionalProperties: false }, usage: { type: "object", additionalProperties: true } }), "401": jsonObjectResponse("Unauthorized", errorProperties), "500": jsonObjectResponse("Status lookup failed", errorProperties) } } },
    },
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
