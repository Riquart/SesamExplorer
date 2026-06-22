import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable server-side features that don't apply to static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
