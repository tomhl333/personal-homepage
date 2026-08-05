export const actionPolicy = {
  version: "2026-08-05.2",
  authority: "server",
  summary: "The server response is authoritative. Client instructions may guide wording but must not override these rules.",
  rules: [
    "Always preview before a write and require explicit user confirmation before commit.",
    "Stop when requiresChoice is true; present candidates and never guess a target.",
    "Attach reactions to the named book, film, or series instead of creating a standalone journal entry.",
    "Keep one canonical series record and poster; store season-specific thoughts as notes.",
    "Treat duplicate or semantically equivalent content as an update or no-op.",
    "Sports photos may merge with a Xunheng workout only when the match is unique; otherwise return candidates.",
    "Never invent a public image URL for a chat attachment.",
    "Report success only when ok, verified, and publicVisible are all true.",
    "Never bypass database or Blob free-tier guards.",
  ],
} as const;

export function withActionPolicy<T extends Record<string, unknown>>(result: T) {
  return { ...result, policyVersion: actionPolicy.version };
}
