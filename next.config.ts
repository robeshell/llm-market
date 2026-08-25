import type { NextConfig } from "next";

/**
 * GitHub Pages 项目站需要 basePath（如 /llm-model-comparison）。
 * 本地开发不设；Actions 里通过 PAGES_BASE_PATH 注入。
 */
const basePath = process.env.PAGES_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

export default nextConfig;
