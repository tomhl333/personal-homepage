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
  { name: "platform", in: "query", description: "Release or streaming platform for a show or film, for example Apple TV+, Netflix, Disney+, Paramount+, HBO, or Prime Video.", schema: { type: "string" } },
  { name: "mediaKind", in: "query", schema: { type: "string", enum: ["电视剧", "电影", "纪录片", "综艺"] } },
  { name: "category", in: "query", description: "Required for activity. Use 纸笔 for handwriting, drawing, and other paper-based work; use 语言学习 for language learning.", schema: { type: "string", enum: ["纸笔", "城市生活", "语言学习", "网球", "游泳", "健身"] } },
  { name: "city", in: "query", description: "City for city-life photos when known from the user or image context.", schema: { type: "string" } },
  { name: "paperType", in: "query", description: "For 纸笔 only. Classify the image as handwriting, drawing, or general paper work.", schema: { type: "string", enum: ["练字", "画画", "纸笔创作"] } },
  { name: "language", in: "query", description: "For 语言学习 only. Select the language recognized from the user's content.", schema: { type: "string", enum: ["粤语", "西班牙语", "其他语言"] } },
  { name: "tag", in: "query", description: "Repeat for each tag.", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true },
  { name: "imageUrl", in: "query", description: "Repeat for each already-public HTTPS image URL from the mobile upload page. Never invent an attachment URL.", schema: { type: "array", items: { type: "string", format: "uri" } }, style: "form", explode: true },
  { name: "workoutId", in: "query", description: "Use only after a unique workout is selected.", schema: { type: "string" } },
];

const trainingPlanParameters = [
  { name: "equipmentMode", in: "query", required: true, description: "Available equipment. Ask only when the user did not specify it.", schema: { type: "string", enum: ["dumbbell", "free_weights", "gym"] } },
  { name: "sessionMinutes", in: "query", required: true, description: "Available training time in minutes.", schema: { type: "integer", enum: [30, 45, 60, 75, 90] } },
  { name: "subjectiveState", in: "query", required: true, description: "Today's subjective recovery state.", schema: { type: "string", enum: ["tired", "normal", "good"] } },
  { name: "targetFocus", in: "query", required: false, description: "Optional focus. Use auto unless the user explicitly requests chest, back, shoulders, legs, or arms.", schema: { type: "string", enum: ["auto", "chest", "back", "shoulders", "legs", "arms"], default: "auto" } },
];

const previewResponse = {
  type: "object",
  required: ["ok", "policyVersion", "action", "candidates", "input", "requiresChoice", "confirmationToken"],
  properties: {
    ok: { type: "boolean" }, policyVersion: { type: "string", example: actionPolicy.version }, action: { type: "string", enum: ["create", "update"] }, confirmationToken: { type: "string", description: "Always returned by preview. Pass it unchanged to commit only after the user confirms and requiresChoice is false." },
    candidates: { type: "array", description: "For sports activities, these are real same-day workout candidates. When exactly one exists, input.workoutId is filled automatically. When multiple exist, choose candidate.id and preview again with it as workoutId.", items: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, detail: { type: "string" } } } },
    input: { type: "object" }, revision: { type: "number" }, requiresChoice: { type: "boolean" }, message: { type: "string" },
    coverLookup: { type: "object", description: "Automatic poster or book-cover lookup result. When available is true, never ask the user for an image URL; commit will preserve or fill the cover.", properties: { available: { type: "boolean" }, existing: { type: "boolean" }, source: { type: "string" }, suggestedTitle: { type: "string" }, willRepairOnCommit: { type: "boolean" } } },
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
    parameters: [{ name: "confirmationToken", in: "query", required: false, description: "Pass unchanged from previewPersonalRecord when available. The server also retains the latest preview for this authenticated Action for mobile clients that cannot retain the token.", schema: { type: "string" } }, { name: "confirmed", in: "query", required: true, description: "Must be true after explicit user confirmation.", schema: { type: "boolean", enum: [true] } }],
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
  const trainingPreviewOperation = {
    operationId: "previewTrainingPlan",
    summary: "Generate a Xunheng training plan without writing it",
    description: "Use for requests such as today's workout plan. Ask for missing equipment, sessionMinutes, or subjectiveState before calling. This analyzes the user's real Xunheng and recovery data, then returns a plan without writing to Xunji.",
    security: [{ actionApiKey: [] }],
    "x-openai-isConsequential": false,
    parameters: trainingPlanParameters,
    responses: {
      "200": { description: "Authoritative Xunheng plan preview", content: { "application/json": { schema: { type: "object", required: ["ok", "plan", "confirmationToken"], properties: { ok: { type: "boolean" }, confirmationToken: { type: "string" }, plan: { type: "object" }, policyVersion: { type: "string" }, message: { type: "string" } } } } } },
      "400": { description: "Invalid input or training service is unavailable" },
    },
  };
  const trainingCommitOperation = {
    operationId: "commitTrainingPlan",
    summary: "Write a confirmed Xunheng training plan to Xunji",
    description: "Call only after the user explicitly confirms the exact generated plan. Pass confirmationToken unchanged when available and set confirmed=true. If the token is unavailable, call with confirmed=true so the server can recover the latest valid training-plan preview for this Action key.",
    security: [{ actionApiKey: [] }],
    "x-openai-isConsequential": false,
    parameters: [
      { name: "confirmationToken", in: "query", required: false, schema: { type: "string" } },
      { name: "confirmed", in: "query", required: true, schema: { type: "boolean", enum: [true] } },
    ],
    responses: {
      "200": { description: "Xunji write result", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" }, saved: { type: "boolean" }, verified: { type: "boolean" }, publicVisible: { type: "boolean" }, plan: { type: "object" }, policyVersion: { type: "string" }, message: { type: "string" } } } } } },
      "409": { description: "Confirmation expired, plan changed, duplicate plan, or write conflict" },
    },
  };

  return Response.json({
    openapi: "3.1.0",
    info: { title: "Personal Homepage Maintenance", version: "2.1.4", description: `Maintain a private personal homepage using server policy ${actionPolicy.version}. Always preview, wait for explicit confirmation, then commit.` },
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
      "/api/actions/training-plan/preview": {
        post: trainingPreviewOperation,
      },
      "/api/actions/training-plan/commit": {
        post: trainingCommitOperation,
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
