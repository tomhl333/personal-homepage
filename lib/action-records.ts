import type { SiteContent } from "@/data/site";
import { readSiteContent, writeSiteContent } from "@/lib/site-content-store";

export type ActionRecordInput = {
  type: "show" | "book" | "activity" | "journal";
  title: string;
  note?: string;
  date?: string;
  season?: string;
  author?: string;
  creator?: string;
  mediaKind?: string;
  status?: string;
  category?: string;
  tags?: string[];
  imageUrls?: string[];
  workoutId?: string;
};

type Candidate = { id: string; title: string; detail?: string };

const activityAliases: Record<string, string> = {
  handwriting: "练字", "练字": "练字",
  city: "城市生活", "城市生活": "城市生活",
  cantonese: "粤语", "粤语": "粤语",
  tennis: "网球", "网球": "网球",
  swimming: "游泳", swim: "游泳", "游泳": "游泳",
  fitness: "健身", strength: "健身", "健身": "健身",
};

const sports = new Set(["网球", "游泳", "健身"]);

function normalized(value = "") {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, "");
}

function seriesTitle(value: string) {
  return value
    .replace(/第\s*[一二三四五六七八九十百\d]+\s*季/giu, "")
    .replace(/\bS(?:eason)?\s*\d+\b/giu, "")
    .replace(/[\s:：-]+$/g, "")
    .trim();
}

function related(left: string, right: string) {
  const a = normalized(left);
  const b = normalized(right);
  return Boolean(a && b && (a === b || (Math.min(a.length, b.length) >= 3 && (a.includes(b) || b.includes(a)))));
}

function section(content: SiteContent, title: string) {
  const found = content.activitySpotlights.find((item) => item.title === title);
  if (!found) throw new Error(`section_not_found:${title}`);
  return found;
}

function candidatesFor(content: SiteContent, input: ActionRecordInput): Candidate[] {
  if (input.type === "show") {
    const requested = seriesTitle(input.title);
    return (section(content, "看剧").shows ?? [])
      .filter((item) => related(seriesTitle(item.title), requested))
      .map((item) => ({ id: item.title, title: item.title, detail: item.kind }));
  }
  if (input.type === "book") {
    return (section(content, "阅读").books ?? [])
      .filter((item) => related(item.title, input.title))
      .map((item) => ({ id: item.title, title: item.title, detail: item.author }));
  }
  return [];
}

function cleanInput(input: ActionRecordInput): ActionRecordInput {
  const title = input.type === "show" ? seriesTitle(input.title) : input.title.trim();
  if (!title) throw new Error("missing_title");
  const category = input.category ? (activityAliases[input.category] ?? input.category.trim()) : undefined;
  return {
    ...input,
    title,
    note: input.note?.trim(),
    author: input.author?.trim(),
    creator: input.creator?.trim(),
    category,
    imageUrls: [...new Set((input.imageUrls ?? []).map((item) => item.trim()).filter((item) => /^https:\/\//i.test(item)))],
    tags: [...new Set((input.tags ?? []).map((item) => item.trim()).filter(Boolean))],
  };
}

export async function previewAction(inputValue: ActionRecordInput) {
  const input = cleanInput(inputValue);
  const { content, revision } = await readSiteContent();
  const candidates = candidatesFor(content, input);
  const ambiguous = candidates.length > 1;
  const categoryRequired = input.type === "activity" && !input.category;
  return {
    ok: !ambiguous && !categoryRequired,
    action: candidates.length === 1 ? "update" : "create",
    candidates,
    input,
    revision,
    requiresChoice: ambiguous || categoryRequired,
    message: ambiguous
      ? "匹配到多个可能记录，请选择 candidate.id 后再保存。"
      : categoryRequired
        ? "活动记录缺少分类，请补充分类后再保存。"
        : "预览完成。只有用户明确确认后才能调用保存操作。",
  };
}

async function internalJson(origin: string, path: string, authorization: string, body: unknown) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json();
  return { ok: response.ok, result, status: response.status };
}

async function localizeImages(origin: string, authorization: string, urls: string[], title: string, uploadDir: string) {
  const stored: string[] = [];
  for (const url of urls) {
    if (url.includes("public.blob.vercel-storage.com/")) {
      stored.push(url);
      continue;
    }
    const response = await internalJson(origin, "/api/admin/remote-image", authorization, { title, uploadDir, url });
    if (!response.ok || !response.result.src) throw new Error(response.result.message ?? "remote_image_save_failed");
    stored.push(response.result.src);
  }
  return stored;
}

export async function commitAction({
  authorization,
  confirmed,
  input: inputValue,
  origin,
  targetId,
}: {
  authorization: string;
  confirmed: boolean;
  input: ActionRecordInput;
  origin: string;
  targetId?: string;
}) {
  if (!confirmed) throw new Error("explicit_confirmation_required");
  const input = cleanInput(inputValue);
  const current = await readSiteContent();
  const content = structuredClone(current.content);
  const existingCandidates = candidatesFor(content, input);
  if (existingCandidates.length > 1 && !targetId) {
    return { ok: false, status: 409, requiresChoice: true, candidates: existingCandidates, message: "匹配不唯一，未写入。" };
  }
  if (targetId && !existingCandidates.some((item) => item.id === targetId)) {
    return { ok: false, status: 409, requiresChoice: true, candidates: existingCandidates, message: "所选记录已变化，请重新预览。" };
  }

  let marker = input.note || input.title;
  let result: Record<string, unknown> = { type: input.type, title: input.title };

  if (input.type === "show") {
    const shows = section(content, "看剧").shows ??= [];
    let show = shows.find((item) => item.title === (targetId ?? existingCandidates[0]?.id));
    if (!show) {
      const asset = await internalJson(origin, "/api/admin/show-poster", authorization, { title: input.title, kind: input.mediaKind ?? "电视剧", uploadDir: "/uploads/shows" });
      show = { title: input.title, creator: input.creator ?? asset.result.creator ?? "", kind: input.mediaKind ?? "电视剧", status: input.status ?? "看过", poster: asset.result.poster, posterTone: "from-fog via-paper to-moss/55", meta: asset.result.year ?? "", characters: [], notes: [] };
      shows.unshift(show);
    }
    if (input.note && !show.notes.some((item) => related(item.text, input.note!))) {
      show.notes.unshift({ type: input.season || "观后札记", text: input.note });
    }
    show.status = input.status || show.status;
    result = { ...result, action: existingCandidates.length ? "updated" : "created", noteAdded: Boolean(input.note), hasCover: Boolean(show.poster) };
  } else if (input.type === "book") {
    const books = section(content, "阅读").books ??= [];
    let book = books.find((item) => item.title === (targetId ?? existingCandidates[0]?.id));
    if (!book) {
      const asset = await internalJson(origin, "/api/admin/book-cover", authorization, { title: input.title, author: input.author ?? "", uploadDir: "/uploads/books" });
      book = { title: asset.result.title ?? input.title, author: asset.result.author ?? input.author ?? "", status: input.status ?? "在读", cover: asset.result.cover, coverTone: "from-fog via-white to-clay/30", notes: [] };
      books.unshift(book);
    }
    if (input.note && !book.notes.some((item) => related(item.text, input.note!))) {
      book.notes.unshift({ type: "读后感", text: input.note });
    }
    book.status = input.status || book.status;
    marker = input.note || book.title;
    result = { ...result, title: book.title, action: existingCandidates.length ? "updated" : "created", noteAdded: Boolean(input.note), hasCover: Boolean(book.cover) };
  } else if (input.type === "journal") {
    const duplicate = content.journalPosts.some((item) => item.date === input.date && related(item.summary || item.body, input.note || input.title));
    if (!duplicate) content.journalPosts.unshift({ date: input.date || new Date().toISOString().slice(0, 10), category: input.category || "生活札记", title: input.title, summary: input.note || "", body: input.note || "", icon: "note" });
    result = { ...result, action: duplicate ? "unchanged" : "created", deduplicated: duplicate };
  } else {
    if (!input.category) throw new Error("category_required");
    const category = activityAliases[input.category] ?? input.category;
    const imageUrls = await localizeImages(origin, authorization, input.imageUrls ?? [], input.title, `/uploads/${encodeURIComponent(category)}`);
    if (sports.has(category) && imageUrls.length) {
      const training = await fetch(`${process.env.TRAINING_HOMEPAGE_URL || "https://xunheng-training.vercel.app"}/api/workout-media`, {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ date: input.date, workoutId: input.workoutId, titleHint: `${category} ${input.title} ${input.note ?? ""}`, note: input.note, category: category === "游泳" ? "swim" : category === "网球" ? "tennis" : "strength", images: imageUrls.map((url) => ({ url, label: input.title })) }),
      });
      const trainingResult = await training.json();
      if (training.status === 409) return { ok: false, status: 409, requiresChoice: true, ...trainingResult };
      if (!training.ok) throw new Error(trainingResult.message ?? "training_media_save_failed");
      return { ok: true, verified: true, publicVisible: true, type: "training-media", ...trainingResult };
    }
    const target = section(content, category);
    if (category === "练字") {
      const checkins = target.checkins ??= [];
      const duplicate = checkins.find((item) => item.date === input.date && related(item.label, input.title));
      const item = duplicate ?? { date: input.date || new Date().toISOString().slice(0, 10), label: input.title, note: input.note, images: [] };
      item.images = [...(item.images ?? []), ...imageUrls.map((src) => ({ src, label: input.title }))].filter((value, index, all) => all.findIndex((other) => other.src === value.src) === index);
      item.src = item.images[0]?.src;
      if (!duplicate) checkins.unshift(item);
    } else {
      const records = target.records ??= [];
      const duplicate = records.some((item) => item.date === input.date && related(item.title, input.title));
      if (!duplicate) records.unshift({ date: input.date || new Date().toISOString().slice(0, 10), title: input.title, summary: input.note || "", tags: input.tags?.length ? input.tags : [category] });
      target.photos.unshift(...imageUrls.map((src) => ({ date: input.date, label: input.title, note: input.note, src, project: input.title })));
    }
    result = { ...result, category, imageCount: imageUrls.length, action: "upserted" };
  }

  const saved = await writeSiteContent(content, current.revision);
  const checked = await readSiteContent();
  const serialized = JSON.stringify(checked.content);
  const verified = serialized.includes(marker);
  let publicVisible = false;
  try {
    const response = await fetch(`${origin}/api/content?action_verify=${Date.now()}`, { cache: "no-store" });
    publicVisible = response.ok && (await response.text()).includes(marker);
  } catch { /* A saved record is not reported as complete without public verification. */ }
  return { ok: verified && publicVisible, saved: true, verified, publicVisible, revision: saved.revision, ...result, message: verified && publicVisible ? "已保存并确认前端可见。" : "数据已写入，但公开页面复核未通过，不能报告完成。" };
}
