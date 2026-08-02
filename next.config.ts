import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  async redirects() {
    return [{ source: "/", destination: "/2026", permanent: false }];
  },
};

export default nextConfig;
