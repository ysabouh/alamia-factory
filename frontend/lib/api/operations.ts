import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export async function postOperation<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    method: "POST",
    headers: authFetchHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? `Operation failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function patchOperation<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    method: "PATCH",
    headers: authFetchHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? `Operation failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
