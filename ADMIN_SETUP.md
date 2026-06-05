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
```

`ADMIN_SESSION_SECRET` 可以随便生成一串长一点的随机字符。它用来签名登录 cookie。

## GitHub Token 权限

建议使用 fine-grained personal access token，只授权这个仓库：

```text
Repository permissions -> Contents -> Read and write
```

不要把 token 写进代码，只放在 Vercel 环境变量里。

## 第一版能力

- 密码登录
- 编辑首页文案
- 编辑联系方式
- 编辑“投入的事”的基础字段
- 用当前模块 JSON 维护书籍、影视、照片、练字、健身等细分结构
- 上传图片到 `public/uploads/...`
- 保存 `data/site-content.json` 到 GitHub，并触发 Vercel 自动部署
