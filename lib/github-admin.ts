type GitHubFile = {
  content: string;
  sha: string;
};

const jsonPath = "data/site-content.json";

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch =
    process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) {
    throw new Error(
      "缺少 GitHub 配置：需要 GITHUB_TOKEN、GITHUB_OWNER、GITHUB_REPO",
    );
  }

  return { branch, owner, repo, token };
}

function apiUrl(path: string) {
  const { owner, repo } = githubConfig();
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
}

async function githubFetch(path: string, init?: RequestInit) {
  const { token } = githubConfig();
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `GitHub API 请求失败：${response.status}`);
  }

  return response.json();
}

function decodeBase64(value: string) {
  return Buffer.from(value.replace(/\n/g, ""), "base64").toString("utf8");
}

function encodeBase64(value: string | Buffer) {
  return Buffer.from(value).toString("base64");
}

export async function readGitHubTextFile(path = jsonPath): Promise<GitHubFile> {
  const { branch } = githubConfig();
  const file = await githubFetch(`${apiUrl(path)}?ref=${encodeURIComponent(branch)}`);

  if (Array.isArray(file) || typeof file.content !== "string") {
    throw new Error(`${path} 不是可读取的文本文件`);
  }

  return {
    content: decodeBase64(file.content),
    sha: file.sha,
  };
}

export async function writeGitHubTextFile({
  content,
  message,
  path = jsonPath,
}: {
  content: string;
  message: string;
  path?: string;
}) {
  const { branch } = githubConfig();
  const current = await readGitHubTextFile(path);

  return githubFetch(apiUrl(path), {
    method: "PUT",
    body: JSON.stringify({
      branch,
      content: encodeBase64(content),
      message,
      sha: current.sha,
    }),
  });
}

export async function writeGitHubBinaryFile({
  content,
  message,
  path,
}: {
  content: Buffer;
  message: string;
  path: string;
}) {
  const { branch } = githubConfig();

  return githubFetch(apiUrl(path), {
    method: "PUT",
    body: JSON.stringify({
      branch,
      content: encodeBase64(content),
      message,
    }),
  });
}

export async function saveRemoteImageToGitHub({
  title,
  uploadDir,
  url,
}: {
  title: string;
  uploadDir: string;
  url: string;
}) {
  const response = await fetch(url, {
    headers: {
      Referer: new URL(url).origin,
      "User-Agent": "Mozilla/5.0 personal-homepage-admin/1.0",
    },
  });
  const contentType = response.headers.get("content-type") ?? "image/jpeg";

  if (!response.ok || !contentType.startsWith("image/")) {
    throw new Error("远程图片无法下载");
  }

  const extension = contentType.includes("png")
    ? ".png"
    : contentType.includes("webp")
      ? ".webp"
      : contentType.includes("gif")
        ? ".gif"
        : ".jpg";
  const { repoPath, src } = normalizeUploadPath(uploadDir, `${title}${extension}`);

  await writeGitHubBinaryFile({
    content: Buffer.from(await response.arrayBuffer()),
    message: `Upload ${src} from mobile admin`,
    path: repoPath,
  });

  return src;
}

export function normalizeUploadPath(uploadDir: string, fileName: string) {
  const dir = uploadDir.trim().replace(/\\/g, "/");

  if (!dir.startsWith("/uploads/") && dir !== "/uploads") {
    throw new Error("上传目录必须在 /uploads 下");
  }

  if (dir.includes("..")) {
    throw new Error("上传目录不能包含 ..");
  }

  const safeName = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  const finalName = safeName || "upload.jpg";
  const src = `${dir}/${Date.now()}-${finalName}`.replace(/\/+/g, "/");
  const repoPath = `public${src}`;

  return { repoPath, src };
}

export function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("上传数据格式不正确");
  }

  return {
    buffer: Buffer.from(match[2], "base64"),
    mime: match[1],
  };
}
