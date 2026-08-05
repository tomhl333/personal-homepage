import { actionPolicy } from "@/lib/action-policy";

export const dynamic = "force-static";
export const runtime = "edge";

export async function GET() {
  const body = JSON.stringify({ ok: true, policyVersion: actionPolicy.version, policyAuthority: actionPolicy.authority });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(new TextEncoder().encode(body).length),
      "Cache-Control": "no-cache",
    },
  });
}
