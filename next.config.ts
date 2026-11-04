import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

// Disponibiliza os bindings do Wrangler (D1 local) em `next dev` via getCloudflareContext().
initOpenNextCloudflareForDev();
