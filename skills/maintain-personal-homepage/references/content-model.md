# Content model

- Neon project: `rapid-feather-80861268`.
- Personal content: `personal.site_content`, one JSONB document with optimistic `revision`.
- Media index: `personal.media_assets`; compressed WebP files live in Vercel Blob.
- Training data stays in Xunheng tables. Training images are linked through `/api/workout-media`, never by direct table edits.
- Activity routing titles: `看剧`, `阅读`, `练字`, `城市生活`, `粤语`, `网球`, `游泳`, `健身`.
- Personal API defaults to `https://personal-homepage-nine-ashen.vercel.app`.
- Training API defaults to `https://xunheng-training.vercel.app`.
- Books and series are canonical parent records. Reactions, seasons, characters, quotations, and plot notes remain nested under their work.
- Cover lookup order: Douban first; accessible fallbacks remain available for verification.
