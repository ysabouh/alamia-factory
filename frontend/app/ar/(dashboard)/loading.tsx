export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-atlas-canvas text-atlas-muted" dir="rtl">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-atlas-brand/30 border-t-atlas-brand"
        aria-hidden
      />
      <p className="text-sm font-medium text-atlas-ink">جاري تحميل لوحة التحكم…</p>
    </div>
  );
}
