# 手机维护台配置

线上维护台地址：

```text
https://你的域名/admin
```

文字内容保存在 Neon，图片经过自动压缩后保存在 Vercel Blob。维护台不再向 GitHub 写入内容或图片，GitHub 只保存代码、Skill、默认内容结构和必要的界面素材。

## Vercel 环境变量

在 Vercel Project Settings → Environment Variables 中配置：

```text
ADMIN_PASSWORD=维护台密码
ADMIN_SESSION_SECRET=用于签名登录 Cookie 的随机长字符串
PERSONAL_CONTENT_API_TOKEN=供受保护 API 和 Skill 使用的随机密钥
DATABASE_URL=Neon 数据库连接地址
BLOB_READ_WRITE_TOKEN=Vercel Blob 读写令牌
TMDB_API_KEY=可选，用于影视海报查询
```

不要把任何令牌写进代码、Skill 或 GitHub 仓库。

## 维护台能力

- 手机端密码登录与内容维护
- 维护书籍、影视、练字、粤语、健身、网球、游泳和城市生活等栏目
- 上传多张图片，并自动压缩为 WebP 后保存到 Vercel Blob
- 查询书籍封面和影视海报，并将远程图片转存到 Vercel Blob
- 内容写入 Neon 后立即重新读取，减少缓存造成的展示延迟
- 存储接近免费额度时按保护策略处理较早且未标星的数据

`/uploads/...` 路径仍保留只读兼容，用来确保旧记录可以正常显示；新的上传不会再写入 GitHub。
