const configuredBase =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE;

function normalizeOrigin(value: string) {
  return value.replace(/\/api\/?$/, "").replace(/\/+$/, "");
}

function resolveApiOrigin() {
  const configured = configuredBase?.trim();

  if (configured) {
    return normalizeOrigin(configured);
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5001";
  }

  throw new Error(
    "VITE_API_BASE_URL (or VITE_API_BASE) must be set for production builds.",
  );
}

export const API_ORIGIN = resolveApiOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/api") ? path.slice(4) : path;
  return `${API_ORIGIN}/api${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

export function getBackendUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/api") ? path.slice(4) : path;
  return `${API_ORIGIN}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}