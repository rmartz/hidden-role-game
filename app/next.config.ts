import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Linting is handled at the workspace level via `pnpm lint`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
