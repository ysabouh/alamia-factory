/**
 * Laravel JSON API base (`/api/v1`, no trailing slash).
 * - Browser: same-origin via Next proxy (no CORS / "Failed to fetch" from cross-port).
 * - Server (RSC): direct to Laravel on 127.0.0.1:8000
 */
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/myfactory").replace(/\/$/, "");
const INTERNAL = (process.env.LARAVEL_INTERNAL_API_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

export function getLaravelApiBaseUrl(): string {
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return `${BASE_PATH}/api/v1`;
  }

  return INTERNAL;
}
