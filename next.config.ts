import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker build (Dockerfile copies .next/standalone) — bundles only the
  // dependencies each page actually needs instead of shipping the full node_modules into the
  // runtime image.
  output: "standalone",
};

export default nextConfig;
