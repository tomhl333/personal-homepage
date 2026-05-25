# 人到中途，仍然好奇

一个偏生活化的个人主页项目，使用 Next.js + TypeScript + Tailwind CSS 构建，适合部署到 Vercel。

## 本地运行

建议使用 Node.js 18.17 或更高版本。

先安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

然后在浏览器打开：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 项目结构

```text
app/
  layout.tsx
  page.tsx
  globals.css
components/
  Hero.tsx
  About.tsx
  Interests.tsx
  Journal.tsx
  Projects.tsx
  Gallery.tsx
  WorkNotes.tsx
  Contact.tsx
  SectionHeading.tsx
data/
  site.ts
```

主要内容都集中在 `data/site.ts` 和各个组件里，后续可以直接替换文案、链接和图片。

## 部署到 Vercel

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 Vercel，点击 `Add New Project`。
3. 选择这个仓库。
4. Framework Preset 选择 `Next.js`。
5. Build Command 保持 `npm run build`。
6. Output Directory 留空，使用 Next.js 默认配置。
7. 点击 `Deploy`。

部署完成后，Vercel 会提供一个线上访问地址。后续每次推送代码，Vercel 会自动重新部署。
