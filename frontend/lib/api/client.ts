import type { LiveDashboard } from "@/types/factory";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** Avoid SSR hanging when Laravel is down or XAMPP/PHP never answers in time. */
const FETCH_TIMEOUT_MS = Number(process.env.LARAVEL_API_FETCH_TIMEOUT_MS ?? "6000");

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([timeout, signal]) : timeout;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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
