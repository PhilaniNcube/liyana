import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    browserDebugInfoInTerminal: true,
    ppr: true,
    clientSegmentCache: true,
    // devtoolSegmentExplorer: true,
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
