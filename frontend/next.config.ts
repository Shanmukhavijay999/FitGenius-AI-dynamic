import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 'loose' CSS chunking prevents Turbopack from re-parsing PostCSS output,
    // fixing the "@layer properties" parse error from Tailwind v4.
    cssChunking: "loose",
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
