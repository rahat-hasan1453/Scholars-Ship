import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // The ROR index is read from disk at runtime (src/lib/ingest/ror.ts), so the tracer can't see it
  outputFileTracingIncludes: {
    '/api/cron/opportunities': ['./prisma/data/ror-index.json.gz'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
