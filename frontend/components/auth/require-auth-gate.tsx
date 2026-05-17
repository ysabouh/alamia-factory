"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { readStoredToken } from "@/lib/auth/factory-auth-api";
import { useFactoryAuth } from "@/contexts/factory-auth-context";

/**
 * يحمي لوحة التحكم بالكامل: بدون جلسة صالحة يُعاد التوجيه إلى ‎/ar/login‎.
 * لا تضع هذا المكوّن داخل ‎/ar/login‎ (صفحة الدخول خارج مجموعة ‎(dashboard)‎).
 */
export function RequireAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isAuthenticated } = useFactoryAuth();

  React.useEffect(() => {
    if (loading) return;
    const token = readStoredToken();
    if (!token || !isAuthenticated) {
      const next = encodeURIComponent(pathname && pathname !== "/ar/login" ? pathname : "/ar");
      router.replace(`/ar/login?next=${next}`);
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-atlas-canvas text-atlas-muted"
        dir="rtl"
      >
        <div
          className="h-12 w-12 animate-spin rounded-full border-2 border-atlas-brand/30 border-t-atlas-brand"
          aria-hidden
        />
        <p className="text-sm font-medium text-atlas-ink">جاري التحقق من الجلسة…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-atlas-canvas text-sm text-atlas-muted" dir="rtl">
        إعادة التوجيه لتسجيل الدخول…
      </div>
    );
  }

  return <>{children}</>;
}
