import type { LiveDashboard } from "@/types/factory";

import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { laravelServerAuthHeaders } from "@/lib/api/laravel-server-auth";

/** Avoid SSR hanging when Laravel is down or XAMPP/PHP never answers in time. */
const FETCH_TIMEOUT_MS = Number(process.env.LARAVEL_API_FETCH_TIMEOUT_MS ?? "2500");

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([timeout, signal]) : timeout;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isServer = typeof window === "undefined";
  const response = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(isServer ? laravelServerAuthHeaders() : {}),
      ...init?.headers
    },
    cache: "no-store",
    signal: withTimeout(init?.signal ?? undefined, FETCH_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  liveDashboard: () => request<LiveDashboard>("/dashboard/live")
};
