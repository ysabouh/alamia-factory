const LARAVEL_ORIGIN = (process.env.NEXT_PUBLIC_LARAVEL_ORIGIN ?? "http://127.0.0.1:8000").replace(/\/$/, "");

/** يحوّل مسار التخزين من Laravel إلى رابط قابل للعرض في المتصفح */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const storageIdx = url.indexOf("/storage/");
    if (storageIdx >= 0) return `${LARAVEL_ORIGIN}${url.slice(storageIdx)}`;
    return url;
  }
  if (url.startsWith("/storage/")) return `${LARAVEL_ORIGIN}${url}`;
  return url;
}
