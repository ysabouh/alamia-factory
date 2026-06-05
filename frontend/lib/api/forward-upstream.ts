import { NextResponse } from "next/server";

const UPSTREAM_TIMEOUT_MS = Number(process.env.API_PROXY_UPSTREAM_TIMEOUT_MS ?? "20000");

export async function forwardRequestToUpstream(
  request: Request,
  pathSegments: string[],
  upstreamBase: string
): Promise<NextResponse> {
  const base = upstreamBase.replace(/\/$/, "");
  const rest = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  const u = new URL(request.url);
  const target = `${base}${rest}${u.search}`;

  const headers = new Headers();
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const lang = request.headers.get("accept-language");
  if (lang) headers.set("accept-language", lang);

  let requestBody: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const raw = await request.arrayBuffer();
    requestBody = raw.byteLength > 0 ? raw : undefined;
    const ct = request.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: requestBody,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });

    const responseBody = upstream.status === 204 ? null : await upstream.text();
    const out = new NextResponse(responseBody, { status: upstream.status });
    const passCt = upstream.headers.get("content-type");
    if (passCt) out.headers.set("content-type", passCt);
    return out;
  } catch {
    return NextResponse.json(
      {
        message: "تعذّر الاتصال بخادم Laravel",
        hint: "شغّل RUN.cmd وتأكد أن Laravel يعمل على المنفذ 8000",
        attempted: target
      