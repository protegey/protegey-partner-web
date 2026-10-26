import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker build (Dockerfile copies .next/standalone) — bundles only the
  // dependencies each page actually needs instead of shipping the full node_modules into the
  // runtime image. Skipped on Vercel (which sets VERCEL=1 at build time automatically): this
  // mode is specifically for self-hosted/Docker deployments and broke every Vercel production
  // build the moment it was added here (confirmed via GitHub's deployments API — every build
  // failed from this commit onward until this fix) — Vercel's own serverless/edge packaging
  // does not need or want it.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
