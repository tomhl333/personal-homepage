import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";

// Minimal real preview schema. It narrows the request shape for GPT Builder
// while preserving the production preview endpoint and its no-write semantics.
export async function GET() {
  return Response.json({
    openapi: "3.1.1",
    info: {
      title: "Personal Homepage Preview",
      version: "1.0.0",
      description: "Preview a book, show, activity, or journal record before any write.",
    },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    components: {
      schemas: {},
      securitySchemes: {
        actionApiKey: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Configured in GPT Builder as a Bearer API key.",
        },
      },
    },
    paths: {
      "/api/actions/preview": {
        post: {
          operationId: "previewPersonalRecord",
          summary: "Preview a personal record",
          description: "Create a preview only. This operation never writes data.",
          security: [{ actionApiKey: [] }],
          "x-openai-isConsequential": false,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["type", "title"],
                  additionalProperties: false,
                  properties: {
                    type: { type: "string", enum: ["book", "show", "activity", "journal"] },
                    title: { type: "string" },
                    note: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Preview result" },
            "401": { description: "Authorization was not accepted" },
          },
        },
      },
    },
  }, { headers: { "Cache-Control": "no-store", "X-Action-Policy-Version": actionPolicy.version } });
}
