import { forwardRequestToUpstream } from "@/lib/api/forward-upstream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INTERNAL = (process.env.LARAVEL_INTERNAL_API_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return forwardRequestToUpstream(request, path ?? [], INTERNAL);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
