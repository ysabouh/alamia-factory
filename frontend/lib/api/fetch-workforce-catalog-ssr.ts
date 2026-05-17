import type { WorkforceCatalogJson } from "@/features/workforce/employee-management/workforce-api-types";
import { normalizeWorkforceCatalog } from "@/features/workforce/employee-management/workforce-employee-mapper";

import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { getLaravelSsrBearerToken, laravelServerAuthHeaders } from "@/lib/api/laravel-server-auth";
import { rawCatalogFromWorkforceMetaResponse } from "@/lib/api/workforce-meta";

const TIMEOUT_MS = Number(process.env.LARAVEL_API_FETCH_TIMEOUT_MS ?? "6000");

/** يحمّل كتالوج الموارد البشرية من Laravel على الخادم عند توفر ‎LARAVEL_SSR_BEARER_TOKEN‎. */
export async function fetchWorkforceCatalogSsr(): Promise<WorkforceCatalogJson | null> {
  if (!getLaravelSsrBearerToken()) return null;
  const url = `${getLaravelApiBaseUrl()}/workforce/meta`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...laravelServerAuthHeaders()
    },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  const raw = rawCatalogFromWorkforceMetaResponse(json);
  return normalizeWorkforceCatalog(raw);
}
