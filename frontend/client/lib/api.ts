import { getApiUrl } from "./apiBase";

export async function api<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(getApiUrl(path), { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status}`);
  }
  if (res.status === 204) return null as TResponse;
  return res.json() as Promise<TResponse>;
}
