# 手机维护台配置

这个项目内置了一个线上维护台：

```text
https://你的域名/admin
```

维护台通过 Vercel API 写回 GitHub。GitHub 有新 commit 后，Vercel 会自动重新部署网站。

## Vercel 环境变量

在 Vercel Project Settings -> Environment Variables 里添加：

```text
ADMIN_PASSWORD=你自己设置的后台密码
ADMIN_SESSION_SECRET=一串更长的随机密钥
GITHUB_TOKEN=你的 GitHub token
GITHUB_OWNER=你的 GitHub 用户名或组织名
GITHUB_REPO=personal-homepage
GITHUB_BRANCH=main
TMDB_API_KEY=可选，用来更准确地获取影视海报
```

`ADMIN_SESSION_SECRET` 可以随便生成一串长一点的随机字符。它用来签名登录 cookie。

`TMDB_API_KEY` 不是必填，但建议配置。影视海报会优先从 TMDB 获取，找不到或没配置时才退回 iTunes Search。TMDB 对电视剧、电影海报的覆盖通常比 iTunes 更好，尤其是中文译名。

## GitHub Token 权限

建议使用 fine-grained personal access token，只授权这个仓库：

```text
Repository permissions -> Contents -> Read and write
```

不要把 token 写进代码，只放在 Vercel 环境变量里。

## 维护台能力

- 密码登录
- 复用本地维护台的完整表单和快捷新增体验
- 维护首页文案、投入模块、长记录、照片专题、小项目、联系方式
- 维护书籍、影视、练字、粤语、健身、网球、游泳、城市生活、做事札记等细分结构
- 获取书籍封面和影视海报，并保存到 GitHub 的 `public/uploads/...`
- 书籍封面优先查 Google Books，再查 Open Library
- 影视海报优先查 TMDB，再查 iTunes Search
- 上传图片到 GitHub 的 `public/uploads/...`
- 保存 `data/site-content.json` 到 GitHub，并触发 Vercel 自动部署
