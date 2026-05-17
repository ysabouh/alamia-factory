/**
 * توكن Sanctum للطلبات من خادم Next فقط (RSC / Route Handlers).
 * أنشئه مرة: ‎`User::first()->createToken('ssr')->plainTextToken`‎ في Tinker ثم ضعه في ‎`.env.local`‎.
 * لا تُعرض المتغير للمتصفح (بدون ‎NEXT_PUBLIC_‎).
 */
export function getLaravelSsrBearerToken(): string | null {
  const t = process.env.LARAVEL_SSR_BEARER_TOKEN?.trim();
  return t || null;
}

export function laravelServerAuthHeaders(): HeadersInit {
  const token = getLaravelSsrBearerToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
