import { actionPolicy } from "@/lib/action-policy";

export const runtime = "edge";

export async function GET() {
  const body = JSON.stringify({ policyVersion: actionPolicy.version });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(new TextEncoder().encode(body).length),
      "Cache-Control": "no-cache",
    },
  });
}
