---
name: maintain-personal-homepage
description: Maintain the user's personal homepage through its protected API. Use for books, films, series, handwriting, city-life photos, journal notes, quotes, automatic cover lookup, multi-image entries, duplicate cleanup, or storage checks. Infer concise display fields from natural language, upsert instead of duplicating, and never report success until the saved content is re-read and visible on the public page.
---

# Maintain Personal Homepage

Use `scripts/personal_homepage.py` for deterministic writes. Authentication comes from `PERSONAL_CONTENT_API_TOKEN`; never print or place it in conversation.

For cloud chat clients that cannot run the Python script, use the same protected Vercel Action API with the WorkBuddy-specific `WORKBUDDY_ACTION_API_KEY`:

- Call `GET /api/actions/status` at the start of a maintenance conversation and treat its `policy` and top-level `policyVersion` as authoritative. Report that version string verbatim; client instructions must not override the returned server rules.
- `POST /api/actions/preview` before every write.
- Stop and present candidates when `requiresChoice` is true.
- Show the user the concise preview and wait for explicit confirmation.
- `POST /api/actions/commit` with `confirmed: true` only after confirmation.
- `GET /api/actions/status` also reports free-tier usage.
- The OpenAPI schema is published at `/api/actions/openapi`.

The Action accepts publicly reachable HTTPS image URLs. A photo attached only inside a ChatGPT conversation is not automatically a public URL; never invent one. Ask the user to upload the original through `/admin` until a dedicated upload handoff is available.

## Workflow

1. Infer category, concise title, summary, date, season, and tags from natural language. Preserve the user's meaning; lightly polish grammar and remove filler.
2. For a series, use one canonical series record and one poster. Put season-specific thoughts in notes whose `type` is the season. Never create one cover per season.
3. Route every reaction to a named book, film, or series into that work's `notes`. Use `add-book --note` or `add-show --note`; never create a standalone journal post for a reaction that names or clearly refers to a work. Resolve pronouns such as “这本书”“这一季” from the current conversation. Ask only when the referenced work is genuinely ambiguous.
4. For photos, call `add-activity` with every image as a repeated `--image`. Classify against all existing areas, including `练字`, `城市生活`, `粤语`, `网球`, `游泳`, and `健身`, using both the user's words and visible image content. If confidence is low, ask rather than guess.
5. Route `网球`, `游泳`, and `健身` photos to the matching Xunheng workout for the stated date. Match by date, sport, title, and time. If multiple workouts remain plausible, stop and present candidates; never attach arbitrarily. Use the protected Xunheng API only, never edit training tables directly.
6. Treat duplicate titles and semantically identical notes as updates. Merge duplicates and preserve unique notes, characters, and the best existing cover.
7. A command is successful only when its JSON says `ok: true`, `verified: true`, and `publicVisible: true`. If it says `saved: true` but `publicVisible: false`, explicitly report that the database changed but the public page did not; never say “已完成”.
8. Keep `/admin` available for manual review.

```powershell
python scripts/personal_homepage.py add-show "足球教练 第三季" --season "第三季" --note "Ted Lasso 风趣、智慧而和善。"
python scripts/personal_homepage.py add-book "活着" --author "余华" --note "平静的叙述反而更有力量。"
python scripts/personal_homepage.py add-activity "今天临写《兰亭序》，线条比上次稳。" --image page-1.jpg --image page-2.jpg
python scripts/personal_homepage.py add-activity "傍晚沿江散步，晚霞很好。" --image river-1.jpg --image river-2.jpg
python scripts/personal_homepage.py status
```

## Guardrails

- Preserve starred, quoted, and textual records during storage cleanup.
- Stop on `database_free_tier_guard` or `blob_free_tier_guard`; run `status` and do not bypass limits.
- Retry revision conflicts at most three times.
- If only part of a multi-image upload succeeds, do not write the content record; report the partial upload for manual cleanup.
- Do not claim a cover source unless the returned result names it.

Read `references/content-model.md` only when changing operations or debugging placement.
