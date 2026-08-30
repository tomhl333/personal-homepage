import type { SiteContent } from "@/data/site";
import { personalSql } from "@/lib/db";

type AppleWorkout = {
  id: string; name: string; start_at: string; duration_seconds?: number;
  distance_meters?: number; active_energy_kcal?: number;
};
type XunjiWorkout = {
  id: string; training_date: string; title: string; duration_seconds?: number;
  movement_count: number; completed_set_count: number; volume_kg: number;
  start_ms?: number; end_ms?: number; raw_json?: string | JsonRecord;
};
type WorkoutMedia = {
  workout_id: string; url: string; label?: string; note?: string;
};

type JsonRecord = Record<string, unknown>;

function object(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function completionFlags(value: unknown, flags: boolean[] = []): boolean[] {
  if (Array.isArray(value)) {
    for (const item of value) completionFlags(item, flags);
  } else if (value && typeof value === "object") {
    const current = value as JsonRecord;
    if (typeof current.done === "boolean") flags.push(current.done);
    for (const child of Object.values(current)) completionFlags(child, flags);
  }
  return flags;
}

function isRealXunjiWorkout(row: XunjiWorkout, now = Date.now()) {
  const startMs = Number(row.start_ms ?? 0);
  const endMs = Number(row.end_ms ?? 0);
  if (!(startMs > 0) || startMs > now || !(endMs >= startMs) || endMs > now) return false;
  if (Number(row.completed_set_count ?? 0) > 0) return true;

  let raw: JsonRecord = {};
  try {
    raw = typeof row.raw_json === "string" ? object(JSON.parse(row.raw_json)) : object(row.raw_json);
  } catch { /* no completion evidence */ }
  const flags = completionFlags(raw.movements);
  if (flags.includes(true)) return true;
  const note = object(raw.note);
  if (note.source === "xunheng" || /计划导入可行性验证|导入测试/.test(row.title)) return false;
  // Timed courses often have no conventional sets (and may retain false flags
  // in their movement template). A real elapsed session is completion evidence.
  return endMs - startMs >= 60_000;
}

function minutes(seconds?: number) {
  return seconds ? Math.max(1, Math.round(seconds / 60)) : 0;
}

function day(value: string) {
  return value.slice(0, 10);
}

function metricSummary(row: AppleWorkout) {
  const values = [];
  if (row.duration_seconds) values.push(`${minutes(row.duration_seconds)} 分钟`);
  if (row.distance_meters) values.push(`${Math.round(row.distance_meters)} 米`);
  if (row.active_energy_kcal) values.push(`${Math.round(row.active_energy_kcal)} 千卡`);
  return values.join(" · ") || "完成一次训练";
}

export async function mergeTrainingIntoContent(content: SiteContent): Promise<SiteContent> {
  try {
    const sql = personalSql();
    const [appleRows, xunjiRows] = await Promise.all([
      sql`SELECT id,name,start_at,duration_seconds,distance_meters,active_energy_kcal
        FROM public.apple_health_workouts
        WHERE start_at::timestamptz >= NOW() - INTERVAL '3 years'
        ORDER BY start_at DESC LIMIT 500`,
      sql`SELECT id,training_date,title,start_ms,end_ms,duration_seconds,movement_count,completed_set_count,volume_kg,raw_json
        FROM public.xunji_workouts
        WHERE training_date::date >= CURRENT_DATE - INTERVAL '3 years'
        ORDER BY training_date DESC,start_ms DESC LIMIT 300`,
    ]);
    let mediaRows: WorkoutMedia[] = [];
    try {
      mediaRows = await sql`SELECT workout_id,url,label,note FROM public.workout_media ORDER BY created_at DESC LIMIT 500` as WorkoutMedia[];
    } catch { /* Training history remains available before the optional media table exists. */ }
    const next = structuredClone(content);
    const apple = appleRows as AppleWorkout[];
    const xunji = (xunjiRows as XunjiWorkout[]).filter((row) => isRealXunjiWorkout(row));
    const month = new Date().toISOString().slice(0, 7);

    for (const title of ["网球", "游泳"] as const) {
      const item = next.activitySpotlights.find((entry) => entry.title === title);
      if (!item) continue;
      const keyword = title === "网球" ? "网球" : "游泳";
      const rows = apple.filter((row) => row.name.includes(keyword));
      const synced = rows.slice(0, 80).map((row) => ({
        date: day(row.start_at), title: row.name, summary: metricSummary(row), tags: [title, "训衡同步"],
      }));
      const manual = (item.records ?? []).filter((record) => !record.tags.includes("训衡同步"));
      item.records = dedupeRecords([...synced, ...manual]);
      const workoutsById = new Map(rows.map((row) => [`apple:${row.id}`, row]));
      const trainingPhotos = mediaRows.flatMap((media) => {
        const workout = workoutsById.get(media.workout_id);
        if (!workout) return [];
        return [{
          date: day(workout.start_at),
          label: media.label || workout.name,
          note: media.note,
          project: workout.name,
          src: media.url,
          tags: [title, "训练记录"],
        }];
      });
      item.photos = dedupePhotos([...trainingPhotos, ...item.photos]);
      const currentMonth = rows.filter((row) => row.start_at.startsWith(month));
      item.status = currentMonth.length ? `本月 ${currentMonth.length} 次 · 训衡同步` : "训衡同步 · 本月暂无";
      if (rows[0]) item.summary = `${rows[0].name} · ${metricSummary(rows[0])}`;
      item.notes = ["训练数据由训衡自动同步", ...item.notes.filter((note) => note !== "训练数据由训衡自动同步")];
    }

    const fitness = next.activitySpotlights.find((entry) => entry.title === "健身");
    if (fitness) {
      fitness.workouts = xunji.slice(0, 80).map((row) => {
        const durationMinutes = minutes(row.duration_seconds);
        const timedOnly = row.completed_set_count === 0 && durationMinutes > 0;
        return {
          date: row.training_date,
          title: row.title,
          parts: [`${row.movement_count} 个动作`, ...(row.completed_set_count > 0 ? [`${row.completed_set_count} 组`] : [])],
          duration: durationMinutes ? `${durationMinutes} 分钟` : "已完成",
          intensity: row.volume_kg ? `${Math.round(row.volume_kg)} kg 总容量` : "训衡同步",
          summary: timedOnly
            ? `完成 ${durationMinutes} 分钟训练。`
            : `完成 ${row.completed_set_count} 组训练${row.volume_kg ? `，总容量 ${Math.round(row.volume_kg)} kg` : ""}。`,
        };
      });
      const workoutsById = new Map(xunji.map((row) => [`xunji:${row.id}`, row]));
      const trainingPhotos = mediaRows.flatMap((media) => {
        const workout = workoutsById.get(media.workout_id);
        if (!workout) return [];
        return [{
          date: workout.training_date,
          label: media.label || workout.title,
          note: media.note,
          project: workout.title,
          src: media.url,
          tags: ["健身", "训练记录"],
        }];
      });
      fitness.photos = dedupePhotos([...trainingPhotos, ...fitness.photos]);
      const currentMonth = xunji.filter((row) => row.training_date.startsWith(month));
      fitness.status = currentMonth.length ? `本月 ${currentMonth.length} 次 · 训衡同步` : "训衡同步 · 本月暂无";
      fitness.notes = ["训练计划与完成记录由训衡维护", ...fitness.notes.filter((note) => note !== "训练计划与完成记录由训衡维护")];
    }
    if (!next.heroTags.includes("训衡同步")) next.heroTags.push("训衡同步");
    return next;
  } catch {
    return content;
  }
}

function dedupePhotos<T extends { date?: string; label?: string; src?: string }>(photos: T[]) {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    const key = photo.src || `placeholder:${photo.date ?? ""}:${photo.label ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

function dedupeRecords<T extends { date: string; title: string }>(records: T[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = `${record.date}|${record.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));
}
