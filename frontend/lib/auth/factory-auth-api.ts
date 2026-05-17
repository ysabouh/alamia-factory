import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/myfactory").replace(/\/$/, "");

/** مسار صفحة الدخول الكامل (يتضمن basePath مثل /myfactory) */
export function getLoginPath(): string {
  return `${BASE_PATH}/ar/login`;
}

export const FACTORY_TOKEN_KEY = "factory_token";
export const FACTORY_USER_KEY = "factory_user";

export type FactoryAuthUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export type LoginResponse = {
  token: string;
  user: FactoryAuthUser;
};

export function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(FACTORY_TOKEN_KEY);
}

export function readStoredUser(): FactoryAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(FACTORY_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FactoryAuthUser;
  } catch {
    return null;
  }
}

export function persistSession(data: LoginResponse): void {
  window.localStorage.setItem(FACTORY_TOKEN_KEY, data.token);
  window.localStorage.setItem(FACTORY_USER_KEY, JSON.stringify(data.user));
}

export function clearSession(): void {
  window.localStorage.removeItem(FACTORY_TOKEN_KEY);
  window.localStorage.removeItem(FACTORY_USER_KEY);
}

/** ترويسات JSON + Bearer لطلبات Laravel من المتصفح */
export function authFetchHeaders(): HeadersInit {
  const token = readStoredToken();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${getLaravelApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        device_name: "myfactory-web"
      }),
      cache: "no-store"
    });
  } catch {
    throw new Error(
      "تعذّر الاتصال بالخادم. شغّل RUN.cmd أو Start-MyFactory.cmd وانتظر حتى يعمل المنفذان 8000 و3010."
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    hint?: string;
    attempted?: string;
    errors?: Record<string, string[]>;
    token?: string;
    user?: FactoryAuthUser;
  };

  if (!res.ok) {
    if (res.status === 503) {
      const hint =
        typeof body.hint === "string"
          ? body.hint
          : "شغّل Start-MyFactory.cmd ثم افتح http://127.0.0.1:3010/myfactory/ar/login";
      throw new Error(
        "خادم الواجهة الخلفية غير متاح. " +
          hint +
          (typeof body.attempted === "string" ? ` (${body.attempted})` : "")
      );
    }
    const first =
      body.errors?.email?.[0] ??
      body.errors?.password?.[0] ??
      (typeof body.message === "string" ? body.message : null) ??
      "فشل تسجيل الدخول";
    throw new Error(first);
  }

  if (!body.token || !body.user) {
    throw new Error("استجابة غير متوقعة من الخادم");
  }

  return { token: body.token, user: body.user };
}

export async function fetchMe(): Promise<FactoryAuthUser> {
  const res = await fetch(`${getLaravelApiBaseUrl()}/auth/me`, {
    headers: authFetchHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error("انتهت الجلسة أو غير مصرّح");
  }
  const u = (await res.json()) as FactoryAuthUser;
  window.localStorage.setItem(FACTORY_USER_KEY, JSON.stringify(u));
  return u;
}

export async function logoutRemote(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${getLaravelApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: authFetchHeaders(),
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** مسح الجلسة محلياً ثم الانتقال فوراً لصفحة الدخول */
export function signOutAndRedirect(): void {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = getLoginPath();
  }
}
