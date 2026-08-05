import type { SiteContent } from "@/data/site";
import { personalSql } from "@/lib/db";

type AppleWorkout = {
  id: string; name: string; start_at: string; duration_seconds?: number;
  distance_meters?: number; active_energy_kcal?: number;
};
type XunjiWorkout = {
  id: string; training_date: string; title: string; duration_seconds?: number;
  movement_count: number; completed_set_count: number; volume_kg: number;
};

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
      sql`SELECT id,training_date,title,duration_seconds,movement_count,completed_set_count,volume_kg
        FROM public.xunji_workouts
        WHERE training_date::date >= CURRENT_DATE - INTERVAL '3 years'
        ORDER BY training_date DESC,start_ms DESC LIMIT 300`,
    ]);
    const next = structuredClone(content);
    const apple = appleRows as AppleWorkout[];
    const xunji = xunjiRows as XunjiWorkout[];
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
      const currentMonth = rows.filter((row) => row.start_at.startsWith(month));
      item.status = currentMonth.length ? `本月 ${currentMonth.length} 次 · 训衡同步` : "训衡同步 · 本月暂无";
      if (rows[0]) item.summary = `${rows[0].name} · ${metricSummary(rows[0])}`;
      item.notes = ["训练数据由训衡自动同步", ...item.notes.filter((note) => note !== "训练数据由训衡自动同步")];
    }

    const fitness = next.activitySpotlights.find((entry) => entry.title === "健身");
    if (fitness) {
      fitness.workouts = xunji.slice(0, 80).map((row) => ({
        date: row.training_date,
        title: row.title,
        parts: [`${row.movement_count} 个动作`, `${row.completed_set_count} 组`],
        duration: row.duration_seconds ? `${minutes(row.duration_seconds)} 分钟` : "已完成",
        intensity: row.volume_kg ? `${Math.round(row.volume_kg)} kg 总容量` : "训衡同步",
        summary: `完成 ${row.completed_set_count} 组训练${row.volume_kg ? `，总容量 ${Math.round(row.volume_kg)} kg` : ""}。`,
      }));
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

function dedupeRecords<T extends { date: string; title: string }>(records: T[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = `${record.date}|${record.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));
}
