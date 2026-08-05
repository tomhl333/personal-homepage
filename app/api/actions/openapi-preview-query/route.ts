import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    openapi: "3.1.1",
    info: { title: "Personal Homepage Preview", version: "1.0.0", description: "Preview before writing. Uses flat parameters and never writes content." },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    components: {
      schemas: {},
      securitySchemes: { actionApiKey: { type: "apiKey", in: "header", name: "Authorization", description: "Configured in GPT Builder as a Bearer API key." } },
    },
    paths: {
      "/api/actions/preview-gpt": {
        get: {
          operationId: "previewPersonalRecord",
          summary: "Preview a record before writing",
          description: "Use the user's actual title, type, and note. Never write data.",
          security: [{ actionApiKey: [] }],
          "x-openai-isConsequential": false,
          parameters: [
            { name: "type", in: "query", required: false, schema: { type: "string", enum: ["book", "show", "activity", "journal"] } },
            { name: "title", in: "query", required: false, schema: { type: "string" } },
            { name: "note", in: "query", required: false, schema: { type: "string" } },
            { name: "status", in: "query", required: false, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Preview or input request", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" }, policyVersion: { type: "string", example: actionPolicy.version } } } } } },
            "401": { description: "Authorization was not accepted" },
          },
        },
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
