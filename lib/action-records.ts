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
  platform?: string;
  mediaKind?: string;
  status?: string;
  category?: string;
  city?: string;
  paperType?: "练字" | "画画" | "纸笔创作";
  language?: "粤语" | "西班牙语" | "其他语言";
  tags?: string[];
  imageUrls?: string[];
  workoutId?: string;
};

type Candidate = { id: string; title: string; detail?: string };

const activityAliases: Record<string, string> = {
  handwriting: "纸笔", paper: "纸笔", "练字": "纸笔", "纸笔": "纸笔",
  city: "城市生活", "城市生活": "城市生活",
  cantonese: "语言学习", spanish: "语言学习", language: "语言学习", "粤语": "语言学习", "西班牙语": "语言学习", "语言学习": "语言学习",
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
  const found = content.activitySpotlights.find((item) => item.title === title || (title === "纸笔" && item.title === "练字") || (title === "语言学习" && item.title === "粤语"));
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
    // The public book/show models do not have a reading or viewing date field.
    date: input.type === "book" || input.type === "show" ? undefined : input.date,
    note: input.note?.trim(),
    author: input.author?.trim(),
    creator: input.creator?.trim(),
    platform: input.platform?.trim(),
    category,
    city: input.city?.trim(),
    imageUrls: [...new Set((input.imageUrls ?? []).map((item) => item.trim()).filter((item) => /^https:\/\//i.test(item)))],
    tags: [...new Set((input.tags ?? []).map((item) => item.trim()).filter(Boolean))],
  };
}

function shanghaiDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

function dateFromImageUrls(urls: string[]) {
  for (const url of urls) {
    const match = url.match(/\/(\d{4}-\d{2}-\d{2})(?:\/|$)/);
    if (match) return match[1];
  }
  return undefined;
}

function knownCities(content: SiteContent) {
  return [...new Set(content.activitySpotlights.flatMap((item) => item.photos.map((photo) => photo.city)).filter(Boolean))] as string[];
}

function compactActivityTitle(title: string, category?: string, city?: string) {
  if (category === "纸笔") {
    const work = title.match(/《([^》]{1,24})》/u)?.[1];
    if (work) return `临《${work}》`;
  }
  const firstClause = title.split(/[，。；：,.!?！？]/u)[0].trim();
  const withoutCity = city && firstClause.startsWith(city) ? firstClause.slice(city.length).trim() : firstClause;
  return (withoutCity || firstClause || title).slice(0, 18);
}

function normalizeActivityInput(input: ActionRecordInput, content: SiteContent): ActionRecordInput {
  if (input.type !== "activity") return input;
  const source = [input.title, input.note].filter(Boolean).join(" ");
  const city = input.city || knownCities(content).find((item) => source.includes(item));
  const hasLongDescription = /[，。；：,.!?！？]/u.test(input.title) || input.title.length > 18;
  const handwritingWork = input.category === "纸笔" ? input.title.match(/《([^》]{1,24})》/u)?.[1] : undefined;
  const paperType = input.category === "纸笔"
    ? input.paperType ?? (/[画绘]|素描|水彩|彩铅|速写/u.test(source) ? "画画" : /书法|临[写帖]|硬笔|毛笔|字帖|练字/u.test(source) ? "练字" : "纸笔创作")
    : undefined;
  const language = input.category === "语言学习"
    ? input.language ?? (/西班牙|español|espanol|hola|gracias|buenos días|buenos dias/iu.test(source) ? "西班牙语" : /粤语|粤拼|jyutping|廣東話|广东话/iu.test(source) ? "粤语" : "其他语言")
    : undefined;
  return {
    ...input,
    city,
    paperType,
    language,
    date: input.date || dateFromImageUrls(input.imageUrls ?? []) || shanghaiDate(),
    title: handwritingWork ? `临《${handwritingWork}》` : hasLongDescription ? compactActivityTitle(input.title, input.category, city) : input.title,
    note: input.note || (hasLongDescription ? input.title : undefined),
  };
}

export async function previewAction(inputValue: ActionRecordInput) {
  const { content, revision } = await readSiteContent();
  const input = normalizeActivityInput(cleanInput(inputValue), content);
  const candidates = candidatesFor(content, input);
  const ambiguous = candidates.length > 1;
  const categoryRequired = input.type === "activity" && !input.category;
  const cityRequired = input.type === "activity" && input.category === "城市生活" && Boolean(input.imageUrls?.length) && !input.city;
  return {
    ok: !ambiguous && !categoryRequired && !cityRequired,
    action: candidates.length === 1 ? "update" : "create",
    candidates,
    input,
    revision,
    requiresChoice: ambiguous || categoryRequired || cityRequired,
    message: ambiguous
      ? "匹配到多个可能记录，请选择 candidate.id 后再保存。"
      : cityRequired
        ? "城市生活图片缺少城市。请补充城市后重新预览。"
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
  expectedRevision,
}: {
  authorization: string;
  confirmed: boolean;
  input: ActionRecordInput;
  origin: string;
  targetId?: string;
  expectedRevision?: number;
}) {
  if (!confirmed) throw new Error("explicit_confirmation_required");
  const input = cleanInput(inputValue);
  const current = await readSiteContent();
  if (expectedRevision !== undefined && expectedRevision !== current.revision) {
    return { ok: false, status: 409, requiresChoice: true, message: "预览已过期，内容发生变化，请重新预览。" };
  }
  const content = structuredClone(current.content);
  const normalizedInput = normalizeActivityInput(input, content);
  const existingCandidates = candidatesFor(content, normalizedInput);
  if (existingCandidates.length > 1 && !targetId) {
    return { ok: false, status: 409, requiresChoice: true, candidates: existingCandidates, message: "匹配不唯一，未写入。" };
  }
  if (targetId && !existingCandidates.some((item) => item.id === targetId)) {
    return { ok: false, status: 409, requiresChoice: true, candidates: existingCandidates, message: "所选记录已变化，请重新预览。" };
  }

  const recordInput = normalizedInput;
  let marker = recordInput.note || recordInput.title;
  let result: Record<string, unknown> = { type: recordInput.type, title: recordInput.title };

  if (recordInput.type === "show") {
    const shows = section(content, "看剧").shows ??= [];
    let show = shows.find((item) => item.title === (targetId ?? existingCandidates[0]?.id));
    if (!show) {
      const asset = await internalJson(origin, "/api/admin/show-poster", authorization, { title: input.title, kind: input.mediaKind ?? "电视剧", uploadDir: "/uploads/shows" });
      show = { title: input.title, creator: input.creator ?? asset.result.creator ?? "", platform: input.platform ?? asset.result.platform ?? "", kind: input.mediaKind ?? "电视剧", status: input.status ?? "看过", poster: asset.result.poster, posterTone: "from-fog via-paper to-moss/55", meta: asset.result.year ?? "", characters: [], notes: [] };
      shows.unshift(show);
    }
    if (input.note && !show.notes.some((item) => related(item.text, input.note!))) {
      show.notes.unshift({ type: input.season || "观后札记", text: input.note });
    }
    show.status = input.status || show.status;
    show.platform = input.platform || show.platform;
    result = { ...result, action: existingCandidates.length ? "updated" : "created", noteAdded: Boolean(input.note), hasCover: Boolean(show.poster) };
  } else if (recordInput.type === "book") {
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
  } else if (recordInput.type === "journal") {
    const duplicate = content.journalPosts.some((item) => item.date === input.date && related(item.summary || item.body, input.note || input.title));
    if (!duplicate) content.journalPosts.unshift({ date: input.date || new Date().toISOString().slice(0, 10), category: input.category || "生活札记", title: input.title, summary: input.note || "", body: input.note || "", icon: "note" });
    result = { ...result, action: duplicate ? "unchanged" : "created", deduplicated: duplicate };
  } else {
    if (!recordInput.category) throw new Error("category_required");
    const category = activityAliases[recordInput.category] ?? recordInput.category;
    const activityDate = recordInput.date || shanghaiDate();
    const imageUrls = await localizeImages(origin, authorization, recordInput.imageUrls ?? [], recordInput.title, `/uploads/${encodeURIComponent(category)}`);
    if (sports.has(category) && imageUrls.length) {
      const training = await fetch(`${process.env.TRAINING_HOMEPAGE_URL || "https://xunheng-training.vercel.app"}/api/workout-media`, {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ date: activityDate, workoutId: recordInput.workoutId, titleHint: `${category} ${recordInput.title} ${recordInput.note ?? ""}`, note: recordInput.note, category: category === "游泳" ? "swim" : category === "网球" ? "tennis" : "strength", images: imageUrls.map((url) => ({ url, label: recordInput.title })) }),
      });
      const trainingResult = await training.json();
      if (training.status === 409) return { ok: false, status: 409, requiresChoice: true, ...trainingResult };
      if (!training.ok) throw new Error(trainingResult.message ?? "training_media_save_failed");
      return { ok: true, verified: true, publicVisible: true, type: "training-media", ...trainingResult };
    }
    const target = section(content, category);
    if (category === "语言学习") {
      const logs = target.learningLogs ??= [];
      const duplicate = logs.some((item) => item.date === activityDate && related(item.title, recordInput.title));
      if (!duplicate) logs.unshift({ date: activityDate, type: recordInput.language ?? "其他语言", title: recordInput.title, summary: recordInput.note ?? "", tags: [recordInput.language ?? "其他语言"] });
      result = { ...result, category, language: recordInput.language, action: duplicate ? "unchanged" : "upserted" };
    } else if (category === "纸笔") {
      const checkins = target.checkins ??= [];
      const duplicate = checkins.find((item) => item.date === activityDate && related(item.label, recordInput.title));
      const item = duplicate ?? { date: activityDate, label: recordInput.title, type: recordInput.paperType, note: recordInput.note, src: undefined, images: [] };
      item.type = recordInput.paperType ?? item.type;
      item.images = [...(item.images ?? []), ...imageUrls.map((src) => ({ src, label: recordInput.title }))].filter((value, index, all) => all.findIndex((other) => other.src === value.src) === index);
      item.src = item.images[0]?.src;
      if (!duplicate) checkins.unshift(item);
    } else {
      const records = target.records ??= [];
      const duplicate = records.some((item) => item.date === activityDate && related(item.title, recordInput.title));
      if (!duplicate) records.unshift({ date: activityDate, title: recordInput.title, summary: recordInput.note || "", tags: recordInput.tags?.length ? recordInput.tags : [category] });
      target.photos.unshift(...imageUrls.map((src) => ({ date: activityDate, city: recordInput.city, label: recordInput.title, note: recordInput.note, src, project: recordInput.title })));
    }
    if (category !== "语言学习") result = { ...result, category, imageCount: imageUrls.length, action: "upserted" };
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
