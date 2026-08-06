"use client";

import { FormEvent, useEffect, useState } from "react";

const uploadDirectories: Record<string, string> = {
  paper: "/uploads/paper",
  city: "/uploads/city-life",
  language: "/uploads/language-learning",
  tennis: "/uploads/tennis",
  swimming: "/uploads/swimming",
  fitness: "/uploads/fitness",
  other: "/uploads",
};

async function fileDataUrl(file: File) {
  const image = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  if (!blob) throw new Error("image_prepare_failed");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function exifCaptureDate(view: DataView) {
  if (view.getUint16(0) !== 0xffd8) return undefined;
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const u16 = (at: number) => view.getUint16(at, little);
      const u32 = (at: number) => view.getUint32(at, little);
      const valueOffset = (at: number) => tiff + u32(at + 8);
      const findTag = (directory: number, wanted: number) => {
        const count = u16(directory);
        for (let index = 0; index < count; index += 1) {
          const entry = directory + 2 + index * 12;
          if (u16(entry) === wanted) return entry;
        }
        return undefined;
      };
      const ifd0 = tiff + u32(tiff + 4);
      const exifPointer = findTag(ifd0, 0x8769);
      if (!exifPointer) return undefined;
      const exifIfd = tiff + u32(exifPointer + 8);
      const dateEntry = findTag(exifIfd, 0x9003) ?? findTag(exifIfd, 0x9004) ?? findTag(ifd0, 0x0132);
      if (!dateEntry) return undefined;
      const count = u32(dateEntry + 4);
      const start = count <= 4 ? dateEntry + 8 : valueOffset(dateEntry);
      let text = "";
      for (let index = 0; index < count && start + index < view.byteLength; index += 1) text += String.fromCharCode(view.getUint8(start + index));
      const match = text.match(/^(\d{4}):(\d{2}):(\d{2})/);
      return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
    }
    offset += 2 + length;
  }
  return undefined;
}

async function captureDate(file: File) {
  try {
    const date = exifCaptureDate(new DataView(await file.arrayBuffer()));
    if (date) return date;
  } catch { /* The upload date remains the safe fallback for unsupported files. */ }
  return undefined;
}

export default function MobileUploadPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [message, setMessage] = useState("正在检查登录状态...");
  const [busy, setBusy] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    void fetch("/api/admin/content").then((response) => {
      setAuthenticated(response.ok);
      setMessage(response.ok ? "已登录。选择照片后上传。" : "请输入后台密码后上传照片。");
    }).catch(() => setMessage("无法检查登录状态。"));
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (!response.ok) return setMessage("密码不正确。");
    setPassword("");
    setAuthenticated(true);
    setMessage("已登录。选择照片后上传。");
  }

  async function upload() {
    if (!files.length) return setMessage("请先选择至少一张照片。");
    setBusy(true);
    setUrls([]);
    setCopyState("idle");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: await fileDataUrl(file), name: title.trim() ? `${title.trim()}-${file.name}` : file.name, uploadDir: uploadDirectories[category], capturedAt: await captureDate(file) }),
        });
        const result = await response.json();
        if (!response.ok || !result.src) throw new Error(result.message || "upload_failed");
        uploaded.push(result.src);
      }
      setUrls(uploaded);
      setMessage("上传完成。复制下方链接并发送回 ChatGPT。图片尚未写入个人主页。");
    } catch (error) {
      setMessage(error instanceof Error ? `上传失败：${error.message}` : "上传失败。");
    } finally {
      setBusy(false);
    }
  }

  async function copyUploadedUrls() {
    const text = urls.join("\n");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("clipboard_unavailable");
      }
      setCopyState("copied");
      setMessage("链接已复制。返回 ChatGPT 后直接粘贴即可，图片尚未写入个人主页。");
    } catch {
      setCopyState("failed");
      setMessage("未能自动复制链接。请长按上方链接并选择复制，再返回 ChatGPT。");
    }
  }

  return <main className="mx-auto min-h-screen max-w-xl px-5 py-8 text-ink">
    <p className="text-xs font-semibold tracking-[0.16em] text-clay">PERSONAL HOMEPAGE</p>
    <h1 className="mt-2 font-serif text-3xl font-semibold">图片上传</h1>
    {!authenticated ? <form className="mt-6 space-y-3" onSubmit={login}>
      <input aria-label="后台密码" className="w-full border border-ink/20 bg-white px-3 py-3" onChange={(event) => setPassword(event.target.value)} placeholder="后台密码" type="password" value={password} />
      <button className="bg-ink px-4 py-3 text-paper disabled:opacity-50" disabled={busy} type="submit">登录</button>
    </form> : <section className="mt-6 space-y-4">
      <label className="block text-sm">图片说明（可选）<input className="mt-1 w-full border border-ink/20 bg-white px-3 py-3" onChange={(event) => setTitle(event.target.value)} placeholder="例如：8 月 5 日河边散步" value={title} /></label>
      <label className="block text-sm">分类<select className="mt-1 w-full border border-ink/20 bg-white px-3 py-3" onChange={(event) => setCategory(event.target.value)} value={category}><option value="other">其他</option><option value="paper">纸笔（练字、画画）</option><option value="city">城市生活</option><option value="language">语言学习（粤语、西班牙语）</option><option value="tennis">网球</option><option value="swimming">游泳</option><option value="fitness">健身</option></select></label>
      <label className="block text-sm">选择照片<input accept="image/*" className="mt-1 block w-full" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} type="file" /></label>
      <button className="bg-ink px-4 py-3 text-paper disabled:opacity-50" disabled={busy} onClick={upload} type="button">{busy ? "上传中..." : "上传并生成链接"}</button>
    </section>}
    <p className="mt-5 text-sm leading-6 text-ink/70">{message}</p>
    {urls.length > 0 && <section className="mt-5 border border-ink/15 bg-white p-4"><p className="text-sm font-semibold">公开图片链接</p>{urls.map((url) => <p className="mt-3 break-all text-sm" key={url}><a className="underline" href={url} rel="noreferrer" target="_blank">{url}</a></p>)}<button aria-live="polite" className="mt-4 border border-ink/30 px-3 py-2 text-sm" onClick={() => void copyUploadedUrls()} type="button">{copyState === "copied" ? "已复制链接" : copyState === "failed" ? "请长按上方链接复制" : "复制全部链接"}</button></section>}
  </main>;
}
