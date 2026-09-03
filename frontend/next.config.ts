import type { NextConfig } from "next";

const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4020").replace(/\/$/, "");

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: { root: __dirname },
  devIndicators: false,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${backendOrigin}/:path*` }];
  },
};

export default nextConfig;
