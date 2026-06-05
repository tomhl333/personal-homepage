"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteContent } from "@/data/site";

const uploadDirs = [
  "/uploads/tennis",
  "/uploads/swimming",
  "/uploads/fitness",
  "/uploads/cantonese",
  "/uploads/spanish",
  "/uploads/reading",
  "/uploads/books",
  "/uploads/shows",
  "/uploads/handwriting",
  "/uploads/city-life",
  "/uploads/work-notes",
];

type AdminTab = "home" | "activity" | "contact" | "upload" | "json";

function cloneContent(content: SiteContent) {
  return JSON.parse(JSON.stringify(content)) as SiteContent;
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

export function AdminClient() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("正在检查登录状态...");
  const [tab, setTab] = useState<AdminTab>("home");
  const [selectedActivity, setSelectedActivity] = useState(0);
  const [uploadDir, setUploadDir] = useState(uploadDirs[0]);
  const [uploadedSrc, setUploadedSrc] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const active = content?.activitySpotlights[selectedActivity];

  const activityJson = useMemo(
    () => (active ? JSON.stringify(active, null, 2) : ""),
    [active],
  );

  useEffect(() => {
    void loadContent();
  }, []);

  async function loadContent() {
    const response = await fetch("/api/admin/content");

    if (response.status === 401) {
      setStatus("请输入后台密码。");
      return;
    }

    const data = await response.json();
    setContent(data.content);
    setJsonText(JSON.stringify(data.content, null, 2));
    setStatus(data.message || "内容已载入。");
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setStatus("正在登录...");

    const response = await fetch("/api/admin/login", {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      setStatus("密码不正确。");
      setIsBusy(false);
      return;
    }

    setPassword("");
    setStatus("登录成功，正在载入内容...");
    await loadContent();
    setIsBusy(false);
  }

  function commitContent(next: SiteContent) {
    setContent(next);
    setJsonText(JSON.stringify(next, null, 2));
  }

  function updateHero(field: keyof SiteContent["hero"], value: string) {
    if (!content) return;
    const next = cloneContent(content);
    next.hero[field] = value;
    commitContent(next);
  }

  function updateHeroTags(value: string) {
    if (!content) return;
    const next = cloneContent(content);
    next.heroTags = lines(value);
    commitContent(next);
  }

  function updateContact(field: keyof SiteContent["contactProfile"], value: string) {
    if (!content) return;
    const next = cloneContent(content);
    next.contactProfile[field] = value;
    commitContent(next);
  }

  function updateActivity(field: "title" | "status" | "summary", value: string) {
    if (!content) return;
    const next = cloneContent(content);
    next.activitySpotlights[selectedActivity][field] = value;
    commitContent(next);
  }

  function updateActivityJson(value: string) {
    if (!content) return;

    try {
      const parsed = JSON.parse(value) as SiteContent["activitySpotlights"][number];
      const next = cloneContent(content);
      next.activitySpotlights[selectedActivity] = parsed;
      commitContent(next);
      setStatus("当前模块 JSON 已应用。");
    } catch {
      setStatus("当前模块 JSON 格式不正确，还没有应用。");
    }
  }

  function applyFullJson() {
    try {
      const parsed = JSON.parse(jsonText) as SiteContent;
      setContent(parsed);
      setStatus("JSON 已应用，确认无误后点保存。");
    } catch {
      setStatus("整份 JSON 格式不正确。");
    }
  }

  async function saveContent() {
    if (!content) return;

    setIsBusy(true);
    setStatus("正在保存到 GitHub...");

    const response = await fetch("/api/admin/content", {
      body: JSON.stringify({ content }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || "保存失败。");
      setIsBusy(false);
      return;
    }

    setStatus("已提交到 GitHub，Vercel 会自动重新部署。");
    setIsBusy(false);
  }

  async function uploadFile(file?: File) {
    if (!file) return;

    setIsBusy(true);
    setStatus("正在上传图片到 GitHub...");

    const response = await fetch("/api/admin/upload", {
      body: JSON.stringify({
        data: await readFileAsDataUrl(file),
        name: file.name,
        uploadDir,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || "上传失败。");
      setIsBusy(false);
      return;
    }

    setUploadedSrc(data.src);
    setStatus(`图片已上传：${data.src}`);
    setIsBusy(false);
  }

  if (!content) {
    return (
      <main className="min-h-screen px-5 py-8 text-ink">
        <section className="mx-auto max-w-md rounded-[1.25rem] border border-ink/10 bg-paper/85 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.22em] text-clay">
            LOCAL STUDIO
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">内容维护台</h1>
          <form className="mt-6 space-y-4" onSubmit={login}>
            <label className="block">
              <span className="text-sm font-semibold text-ink/60">后台密码</span>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 outline-none focus:border-moss"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            <button
              className="w-full rounded-2xl bg-moss px-5 py-3 font-semibold text-paper disabled:opacity-50"
              disabled={isBusy}
              type="submit"
            >
              登录
            </button>
          </form>
          <p className="mt-4 text-sm leading-6 text-ink/55">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-[1.25rem] border border-ink/10 bg-paper/85 p-5 shadow-soft lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
          <p className="text-xs font-semibold tracking-[0.22em] text-clay">
            MOBILE ADMIN
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">内容维护台</h1>
          <p className="mt-3 text-sm leading-6 text-ink/55">{status}</p>

          <nav className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {[
              ["home", "首页"],
              ["activity", "投入"],
              ["contact", "联系"],
              ["upload", "上传"],
              ["json", "JSON"],
            ].map(([key, label]) => (
              <button
                className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                  tab === key ? "bg-moss text-paper" : "bg-white/45 text-ink/65"
                }`}
                key={key}
                onClick={() => setTab(key as AdminTab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            className="mt-6 w-full rounded-2xl bg-moss px-5 py-3 font-semibold text-paper disabled:opacity-50"
            disabled={isBusy}
            onClick={saveContent}
            type="button"
          >
            保存到网站
          </button>
        </aside>

        <section className="rounded-[1.25rem] border border-ink/10 bg-white/65 p-4 shadow-soft sm:p-6">
          {tab === "home" ? (
            <div className="space-y-4">
              <Field
                label="开场小字"
                onChange={(value) => updateHero("eyebrow", value)}
                value={content.hero.eyebrow}
              />
              <Field
                label="主标题"
                onChange={(value) => updateHero("title", value)}
                value={content.hero.title}
              />
              <Textarea
                label="说明文字"
                onChange={(value) => updateHero("description", value)}
                rows={5}
                value={content.hero.description}
              />
              <Textarea
                label="标签，一行一个"
                onChange={updateHeroTags}
                rows={5}
                value={content.heroTags.join("\n")}
              />
            </div>
          ) : null}

          {tab === "activity" ? (
            <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
              <div className="space-y-2">
                {content.activitySpotlights.map((item, index) => (
                  <button
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                      selectedActivity === index
                        ? "bg-moss text-paper"
                        : "bg-paper/70 text-ink/65"
                    }`}
                    key={item.title}
                    onClick={() => setSelectedActivity(index)}
                    type="button"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {active ? (
                <div className="space-y-4">
                  <Field
                    label="标题"
                    onChange={(value) => updateActivity("title", value)}
                    value={active.title}
                  />
                  <Field
                    label="状态"
                    onChange={(value) => updateActivity("status", value)}
                    value={active.status}
                  />
                  <Textarea
                    label="简介"
                    onChange={(value) => updateActivity("summary", value)}
                    rows={5}
                    value={active.summary}
                  />
                  <Textarea
                    label="当前模块 JSON"
                    onBlur={updateActivityJson}
                    rows={18}
                    value={activityJson}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "contact" ? (
            <div className="space-y-4">
              <Textarea
                label="联系区说明"
                onChange={(value) => updateContact("description", value)}
                rows={5}
                value={content.contactProfile.description}
              />
              <Field
                label="邮箱"
                onChange={(value) => updateContact("email", value)}
                value={content.contactProfile.email}
              />
              <Field
                label="微信"
                onChange={(value) => updateContact("wechat", value)}
                value={content.contactProfile.wechat}
              />
              <Field
                label="微信二维码路径"
                onChange={(value) => updateContact("wechatQr", value)}
                value={content.contactProfile.wechatQr}
              />
            </div>
          ) : null}

          {tab === "upload" ? (
            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-ink/60">上传目录</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-paper px-4 py-3"
                  onChange={(event) => setUploadDir(event.target.value)}
                  value={uploadDir}
                >
                  {uploadDirs.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block rounded-[1.25rem] border border-dashed border-ink/20 bg-paper/70 p-6 text-center">
                <span className="font-semibold text-moss">选择手机图片上传</span>
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => void uploadFile(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {uploadedSrc ? (
                <div className="rounded-2xl bg-moss/10 p-4">
                  <p className="text-sm font-semibold text-moss">已生成路径</p>
                  <code className="mt-2 block break-all text-sm text-ink/70">
                    {uploadedSrc}
                  </code>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "json" ? (
            <div className="space-y-4">
              <Textarea
                label="整份 site-content.json"
                onChange={setJsonText}
                rows={28}
                value={jsonText}
              />
              <button
                className="rounded-2xl bg-ink px-5 py-3 font-semibold text-paper"
                onClick={applyFullJson}
                type="button"
              >
                应用 JSON
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink/60">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-ink/10 bg-paper px-4 py-3 outline-none focus:border-moss"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function Textarea({
  label,
  onBlur,
  onChange,
  rows,
  value,
}: {
  label: string;
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
  rows: number;
  value: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink/60">{label}</span>
      <textarea
        className="mt-2 w-full rounded-2xl border border-ink/10 bg-paper px-4 py-3 font-sans text-sm leading-7 outline-none focus:border-moss"
        onBlur={() => onBlur?.(draft)}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange?.(event.target.value);
        }}
        rows={rows}
        value={draft}
      />
    </label>
  );
}
