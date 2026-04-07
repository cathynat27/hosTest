const DEV_LOGIN_FLAG = "true";

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getBackendBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  return trimTrailingSlashes(rawUrl);
}

export function buildBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}

export function isDevLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === DEV_LOGIN_FLAG;
}
