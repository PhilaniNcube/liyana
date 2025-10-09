import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    
  },
  experimental: {
    browserDebugInfoInTerminal: true,
    // ppr: true,
    // clientSegmentCache: true,
    // devtoolSegmentExplorer: true,
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
