import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-dynamic";

// A deliberately minimal Action schema for validating GPT Builder's execution
// path independently of the richer write-operation schema.
export async function GET() {
  return Response.json({
    openapi: "3.1.1",
    info: {
      title: "Personal Homepage Status",
      version: "1.0.0",
      description: "Read the authoritative personal-homepage policy version.",
    },
    servers: [{ url: "https://personal-homepage-nine-ashen.vercel.app" }],
    paths: {
      "/actions/status.json": {
        get: {
          operationId: "getPersonalStorageStatus",
          summary: "Get policy version",
          description: "Return the policyVersion from the HTTP response exactly.",
          responses: {
            "200": {
              description: "Policy version",
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
