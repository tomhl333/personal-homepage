export default function PrivacyPage() {
  return <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-ink"><h1 className="font-serif text-4xl font-semibold">个人主页维护助手隐私说明</h1><div className="mt-8 space-y-4 text-sm leading-7 text-ink/70"><p>这是仅供站点所有者使用的私人维护工具。</p><p>提交的文字记录保存在 Neon，图片在压缩后保存在 Vercel Blob。服务不会把个人内容或图片写入 GitHub。</p><p>接口使用独立密钥鉴权。密钥不会保存在网页代码、GitHub 仓库或 Skill 文件中。</p><p>删除或清理遵循站点的免费额度保护策略；标星、引用和文字记录会优先保留。</p></div></main>;
}
