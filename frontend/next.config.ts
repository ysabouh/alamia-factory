import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** مسار التطبيق تحت XAMPP: http://localhost/myfactory */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/myfactory").replace(/\/$/, "") || "";

/** جذر المستودع (myfactory) حتى لا يختار Next جذراً خاطئاً بسبب package-lock في الأب */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
  ...(basePath ? { basePath, assetPrefix: basePath } : {})
};

export default nextConfig;
