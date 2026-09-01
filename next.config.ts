import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: menghasilkan server.js minimal + traced deps — wajib untuk Docker/Coolify
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
