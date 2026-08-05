import { actionPolicy } from "@/lib/action-policy";

const server = "https://personal-homepage-nine-ashen.vercel.app";

const commonParameters = [
  { name: "type", in: "path", required: true, description: "Record type.", schema: { type: "string", enum: ["book", "show", "activity", "journal"] } },
  { name: "title", in: "path", required: true, description: "Concise title of the book, show, activity, or journal entry.", schema: { type: "string" } },
  { name: "note", in: "query", description: "The user's reflection. Do not invent facts.", schema: { type: "string" } },
  { name: "status", in: "query", description: "For example read, watched, or completed.", schema: { type: "string" } },
  { name: "date", in: "query", description: "Record date in YYYY-MM-DD.", schema: { type: "string", format: "date" } },
  { name: "season", in: "query", description: "Season label for a show note. Do not create a separate show record.", schema: { type: "string" } },
  { name: "author", in: "query", schema: { type: "string" } },
  { name: "creator", in: "query", schema: { type: "string" } },
  { name: "mediaKind", in: "query", schema: { type: "string", enum: ["电视剧", "电影", "纪录片", "综艺"] } },
  { name: "category", in: "query", description: "Required for activity.", schema: { type: "string", enum: ["练字", "城市生活", "粤语", "网球", "游泳", "健身"] } },
  { name: "tag", in: "query", description: "Repeat for each tag.", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true },
  { name: "imageUrl", in: "query", description: "Repeat for each already-public HTTPS image URL from the mobile upload page. Never invent an attachment URL.", schema: { type: "array", items: { type: "string", format: "uri" } }, style: "form", explode: true },
  { name: "workoutId", in: "query", description: "Use only after a unique workout is selected.", schema: { type: "string" } },
];

const previewResponse = {
  type: "object",
  required: ["ok", "policyVersion", "action", "candidates", "input", "requiresChoice", "confirmationToken"],
  properties: {
    ok: { type: "boolean" }, policyVersion: { type: "string", example: actionPolicy.version }, action: { type: "string", enum: ["create", "update"] }, confirmationToken: { type: "string", description: "Always returned by preview. Pass it unchanged to commit only after the user confirms and requiresChoice is false." },
    candidates: { type: "array", items: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, detail: { type: "string" } } } },
    input: { type: "object" }, revision: { type: "number" }, requiresChoice: { type: "boolean" }, message: { type: "string" },
  },
};

export const dynamic = "force-dynamic";

export async function GET() {
  const previewOperation = {
    operationId: "previewPersonalRecord",
    summary: "Preview a record before writing",
    description: "Always call first. If requiresChoice is true, present candidates and stop. This operation never writes.",
    security: [{ actionApiKey: [] }],
    "x-openai-isConsequential": false,
    parameters: commonParameters,
    responses: {
      "200": { description: "Authoritative preview", content: { "application/json": { schema: previewResponse } } },
      "401": { description: "Authorization was not accepted" },
    },
  };
  const commitOperation = {
    operationId: "commitPersonalRecord",
    summary: "Commit a confirmed preview and verify the public page",
    description: "Call only after the user explicitly confirms the exact preview. Pass confirmationToken unchanged from that preview and set confirmed to true. Never call when requiresChoice is true.",
    security: [{ actionApiKey: [] }],
    // The conversation's explicit "确认" is the write approval. Marking this
    // false avoids a second ChatGPT approval prompt that can prevent the POST
    // from being sent at all on mobile clients.
    "x-openai-isConsequential": false,
    parameters: [{ name: "confirmationToken", in: "query", required: true, description: "Pass unchanged from previewPersonalRecord after explicit user confirmation.", schema: { type: "string" } }, { name: "confirmed", in: "query", required: true, description: "Must be true after explicit user confirmation.", schema: { type: "boolean", enum: [true] } }],
    responses: {
      "200": {
        description: "Write and public-page verification result",
        content: {
          "application/json": {
            schema: { type: "object", properties: { ok: { type: "boolean" }, saved: { type: "boolean" }, verified: { type: "boolean" }, publicVisible: { type: "boolean" }, policyVersion: { type: "string" }, message: { type: "string" } } },
          },
        },
      },
      "409": { description: "Choice required; nothing was written" },
    },
  };

  return Response.json({
    openapi: "3.1.0",
    info: { title: "Personal Homepage Maintenance", version: "2.1.1", description: `Maintain a private personal homepage using server policy ${actionPolicy.version}. Always preview, wait for explicit confirmation, then commit.` },
    servers: [{ url: server }],
    components: { schemas: {}, securitySchemes: { actionApiKey: { type: "apiKey", in: "header", name: "Authorization", description: "Configure this Action in GPT Builder with API Key and Bearer." } } },
    security: [{ actionApiKey: [] }],
    paths: {
      "/api/actions/mobile/{type}/{title}/preview": {
        post: previewOperation,
      },
      "/api/actions/mobile/commit": {
        post: commitOperation,
      },
      "/api/actions/status": {
        get: {
          operationId: "getPersonalStorageStatus",
          summary: "Get the server policy version and storage state",
          security: [{ actionApiKey: [] }],
          "x-openai-isConsequential": false,
          responses: {
            "200": {
              description: "Authoritative policy status",
              content: { "application/json": { schema: { type: "object", required: ["policyVersion"], properties: { policyVersion: { type: "string" } } } } },
            },
          },
        },
      },
      "/api/actions/photo-upload-guide": {
        get: {
          operationId: "getPhotoUploadGuide",
          summary: "Get the secure mobile image upload page",
          description: "Use when the user attached an image but no public HTTPS URL exists.",
          security: [{ actionApiKey: [] }],
          "x-openai-isConsequential": false,
          responses: {
            "200": {
              description: "Mobile upload handoff",
              content: { "application/json": { schema: { type: "object", required: ["ok", "uploadUrl", "policyVersion"], properties: { ok: { type: "boolean" }, uploadUrl: { type: "string", format: "uri" }, policyVersion: { type: "string" }, message: { type: "string" } } } } },
            },
          },
        },
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
