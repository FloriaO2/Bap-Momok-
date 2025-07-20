import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/groups/:path*",
        destination: "http://127.0.0.1:8000/groups/:path*"
      }
    ];
  }
};

export default nextConfig;
