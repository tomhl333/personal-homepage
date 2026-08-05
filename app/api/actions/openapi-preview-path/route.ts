import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    openapi: "3.1.0",
    info: { title: "Personal Homepage Preview", version: "1.0.0", description: "Preview a record before writing. This operation never writes content." },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    components: {
      schemas: {},
      securitySchemes: { actionApiKey: { type: "apiKey", in: "header", name: "Authorization", description: "Configured in GPT Builder as a Bearer API key." } },
    },
    security: [{ actionApiKey: [] }],
    paths: {
      "/api/actions/preview-path/{type}/{title}": {
        post: {
          operationId: "previewPersonalRecord",
          summary: "Preview a record before writing",
          description: "Use the user's actual record type and title. Never write content.",
          security: [{ actionApiKey: [] }],
          "x-openai-isConsequential": false,
          parameters: [
            { name: "type", in: "path", required: true, description: "Record type: book, show, activity, or journal.", schema: { type: "string", enum: ["book", "show", "activity", "journal"] } },
            { name: "title", in: "path", required: true, description: "The concise record title.", schema: { type: "string" } },
            { name: "note", in: "query", required: false, description: "The user's reflection or note.", schema: { type: "string" } },
            { name: "status", in: "query", required: false, description: "The record status, such as read or watched.", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Preview result", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" }, policyVersion: { type: "string", example: actionPolicy.version } } } } } },
            "401": { description: "Authorization was not accepted" },
          },
        },
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
