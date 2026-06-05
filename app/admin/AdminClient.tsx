"use client";

import { useEffect, useState } from "react";

const studioScriptId = "personal-homepage-admin-studio";

export function AdminClient() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("正在检查登录状态...");

  useEffect(() => {
    async function checkSession() {
      const response = await fetch("/api/admin/content");

      if (response.status === 401) {
        setIsAuthed(false);
        setStatus("请输入后台密码。");
      } else {
        setIsAuthed(true);
        setStatus("登录状态有效，正在载入维护台...");
      }

      setIsChecking(false);
    }

    void checkSession();
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    document.querySelector(`#${studioScriptId}`)?.remove();
    const script = document.createElement("script");
    script.id = studioScriptId;
    script.src = `/admin-studio/studio.js?v=${Date.now()}`;
    script.type = "module";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [isAuthed]);

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
    setStatus("登录成功，正在载入维护台...");
    setIsAuthed(true);
    setIsBusy(false);
  }

  if (isChecking) {
    return (
      <main className="min-h-screen px-5 py-8 text-ink">
        <section className="mx-auto max-w-md rounded-[1.25rem] border border-ink/10 bg-paper/85 p-6 shadow-soft">
          <p className="text-sm leading-7 text-ink/60">{status}</p>
        </section>
      </main>
    );
  }

  if (!isAuthed) {
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
    <>
      <link href="/admin-studio/styles.css" rel="stylesheet" />
      <main className="shell">
        <aside className="sidebar">
          <p className="eyebrow">LOCAL STUDIO</p>
          <h1>内容维护台</h1>
          <p className="hint">
            手机上也能维护主页内容。保存后会提交到 GitHub，并触发 Vercel 自动部署。
          </p>
          <nav className="tabs" id="tabs" />
          <button className="save" id="save" type="button">
            保存到网站
          </button>
          <p className="status" id="status">
            正在读取内容...
          </p>
        </aside>
        <section className="workspace">
          <div className="item-tabs" id="itemTabs" />
          <div className="editor" id="editor" />
        </section>
      </main>
    </>
  );
}
