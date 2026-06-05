export function resolveMediaPath(value?: string) {
  if (!value) return undefined;

  const normalized = value.trim().replace(/\\/g, "/");
  if (!normalized) return undefined;

  const publicUploadsMarker = "/public/uploads/";
  const publicUploadsIndex = normalized.indexOf(publicUploadsMarker);
  if (publicUploadsIndex >= 0) {
    return normalized.slice(publicUploadsIndex + "/public".length);
  }

  if (normalized.startsWith("public/uploads/")) {
    return `/${normalized.slice("public/".length)}`;
  }

  if (normalized.startsWith("/public/uploads/")) {
    return normalized.slice("/public".length);
  }

  return normalized;
}

