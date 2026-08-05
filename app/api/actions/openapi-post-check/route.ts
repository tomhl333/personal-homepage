import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";

// A one-operation, no-body POST schema isolates the Action transport layer.
export async function GET() {
  return Response.json({
    openapi: "3.1.1",
    info: {
      title: "Personal Homepage Action POST Check",
      version: "1.0.1",
      description: "Verify the authenticated Action POST transport without changing content.",
    },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    components: {
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
      "/api/actions/ping": {
        post: {
          operationId: "checkPersonalHomepageActionPost",
          security: [{ actionApiKey: [] }],
          summary: "Check Action POST transport",
          description: "Call this operation. It has no parameters and never changes content.",
          "x-openai-isConsequential": false,
          responses: {
            "200": {
              description: "Transport is available",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "policyVersion"],
                    additionalProperties: false,
                    properties: {
                      ok: { type: "boolean", example: true },
                      policyVersion: { type: "string", example: actionPolicy.version },
                    },
                  },
                },
              },
            },
            "401": { description: "Authorization was not accepted" },
          },
        },
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
