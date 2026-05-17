"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Factory } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IndustrialInput } from "@/components/smart-factory";
import { useFactoryAuth } from "@/contexts/factory-auth-context";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { login, isAuthenticated, loading: authBoot } = useFactoryAuth();

  const [email, setEmail] = React.useState("admin@myfactory.local");
  const [password, setPassword] = React.useState("Admin@2026");
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const rawNext = search.get("next")?.trim() || "/ar";
  const nextPath = rawNext.startsWith("/ar") ? rawNext : "/ar";
  React.useEffect(() => {
    if (!authBoot && isAuthenticated) {
      router.replace(nextPath as Route);
    }
  }, [authBoot, isAuthenticated, nextPath, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.replace(nextPath as Route);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Factory className="h-8 w-8" aria-hidden />
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">MyFactory</p>
          <h1 className="text-xl font-bold text-white">تسجيل الدخول</h1>
          <p className="text-sm text-white/60">القوى العاملة والصلاحيات من Laravel (Sanctum + Spatie)</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-white/70">
              البريد
            </label>
            <IndustrialInput
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-white/70">
              كلمة المرور
            </label>
            <div className="relative">
              <IndustrialInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
                className="w-full pe-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white/90"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                title={showPassword ? "إخفاء" : "إظهار"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
          ) : null}

          <Button
            type="submit"
            disabled={busy || authBoot}
            className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {busy ? "جاري الدخول…" : "دخول"}
          </Button>
        </form>

        <p className="mt-3 text-center text-xs text-white/40">
          Local super-admin: <span className="font-mono">admin@myfactory.local</span> /{" "}
          <span className="font-mono">Admin@2026</span>
        </p>

        <p className="mt-6 text-center text-xs text-white/45">
          بعد الدخول تُحمّل صلاحياتك تلقائياً (مثل <span className="font-mono">workforce.manage_employees</span> لإضافة موظف).
        </p>

        <p className="mt-4 text-center text-sm text-white/50">
          <Link href="/ar" className="text-emerald-400/90 underline-offset-2 hover:underline">
            العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ArLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white/60" dir="rtl">
          جاري التحميل…
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
