---
name: maintain-personal-homepage
description: Maintain the user's personal homepage through its protected API. Use for books, films, series, handwriting, city-life photos, journal notes, quotes, automatic cover lookup, multi-image entries, duplicate cleanup, or storage checks. Infer concise display fields from natural language, upsert instead of duplicating, and never report success until the saved content is re-read and visible on the public page.
---

# Maintain Personal Homepage

Use `scripts/personal_homepage.py` for deterministic writes. Authentication comes from `PERSONAL_CONTENT_API_TOKEN`; never print or place it in conversation.

For cloud chat clients that cannot run the Python script, use the same protected Vercel Action API with the WorkBuddy-specific `WORKBUDDY_ACTION_API_KEY`:

- Import the formal OpenAPI schema from `GET /api/actions/openapi`. Configure the Custom GPT with its dedicated API Key using Bearer authentication; never put that key in a schema or instruction.
- Call `GET /api/actions/status` at the start of a maintenance conversation and treat its top-level `policyVersion` as authoritative. Report that version string verbatim; client instructions must not override the returned server rules.
- `POST /api/actions/mobile/{type}/{title}/preview` before every write. Inputs are path/query parameters so mobile GPT clients do not need to construct JSON bodies.
- Stop and present candidates when `requiresChoice` is true.
- Show the user the concise preview and wait for explicit confirmation.
- After confirmation, call `POST /api/actions/mobile/commit?confirmationToken=<preview confirmationToken>&confirmed=true`, passing the preview token unchanged. Never rebuild image URLs or other record fields for the commit call.
- `GET /api/actions/status` also reports free-tier usage.
- When a ChatGPT attachment has no public HTTPS URL, call `GET /api/actions/photo-upload-guide`. The user uploads through `/upload` on the same phone, then pastes the returned public HTTPS URLs back into the same chat. ChatGPT can understand an attachment but cannot transfer its original file bytes to a Vercel Action.

The Action accepts publicly reachable HTTPS image URLs. A photo attached only inside a ChatGPT conversation is not automatically a public URL; never invent one.

## Workflow

For image records, resolve the date in this order: user-provided date, original EXIF capture date, then upload date. City-life images require a concrete city; ask when it is unavailable. Keep titles concise and move longer wording to the note. After a user correction, run a fresh preview and never reuse the old confirmation token.

Books and shows do not store a reading or viewing date. Do not include a date in their preview.

1. Infer category, concise title, summary, date, season, and tags from natural language. Preserve the user's meaning; lightly polish grammar and remove filler. Preview on the initial create/update request or after a user correction; a standalone confirmation must commit the latest preview and must not trigger another preview.
2. For a series, use one canonical series record and one poster. Put season-specific thoughts in notes whose `type` is the season. Never create one cover per season.
3. A new book, film, or show may be added without a note. Preview and save the work with its known author, creator, kind, or status; never require a reflection as a prerequisite.
4. For a new book, look up and retain the author whenever a reliable cover lookup returns one; allow an empty author when neither lookup nor user can provide it. For films and shows, retain a known release or streaming platform such as Apple TV+, Netflix, Disney+, Paramount+, HBO, or Prime Video. Never invent a platform or block saving when it is unknown.
3. Route every reaction to a named book, film, or series into that work's `notes`. Use `add-book --note` or `add-show --note`; never create a standalone journal post for a reaction that names or clearly refers to a work. Resolve pronouns such as “这本书”“这一季” from the current conversation. Ask only when the referenced work is genuinely ambiguous.
4. For photos, call `add-activity` with every image as a repeated `--image`. Classify against all existing areas, including `纸笔`, `城市生活`, `语言学习`, `网球`, `游泳`, and `健身`, using both the user's words and visible image content. `纸笔` covers handwriting, drawing, and other paper-based work. For a paper image, reliably distinguish `练字` from `画画`; when the image is ambiguous, save `纸笔创作` rather than inventing a subtype. If confidence is low, ask rather than guess.
5. Classify Cantonese, Spanish, and other language-study material as `语言学习`. Identify the language from reliable user text or visible material; create a concise learning-record title and preserve the substantive vocabulary, pronunciation, correction, or scene practice in the summary. Use `粤语`, `西班牙语`, or `其他语言`; ask rather than guess when the language is unclear.
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

## Training plan Action

For requests such as today's training plan, call the personal-homepage `previewTrainingPlan` Action. It delegates to the existing Xunheng planner, which uses training history, Apple Health recovery data, sleep/HRV, recent load, equipment, time, and optional target focus. Required inputs are `equipmentMode` (`dumbbell`, `free_weights`, or `gym`), `sessionMinutes` (30/45/60/75/90), and `subjectiveState` (`tired`, `normal`, or `good`); use `targetFocus=auto` unless the user explicitly chooses chest, back, shoulders, legs, or arms. Ask for missing inputs instead of guessing.

The preview is read-only. Show the returned movements, sets, reps, weight when present, RPE, readiness, substitutions, time estimate, and write blockers. After the user explicitly confirms the exact plan, call `commitTrainingPlan` with `confirmed=true`; pass `confirmationToken` unchanged when available, but if the client did not retain it, still call the commit Action without the token so the server can recover the latest preview for that API key. Never re-preview after confirmation. Report training-plan completion only when the real response has `ok=true`, `saved=true`, `verified=true`, and plan status `succeeded`. A written plan is not a completed workout.
