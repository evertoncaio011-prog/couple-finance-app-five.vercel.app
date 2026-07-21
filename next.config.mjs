/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Next.js 16 defaults to Turbopack and warns if it detects a project
  // that might expect webpack-specific config without an explicit
  // Turbopack config. We don't have any custom webpack config, but an
  // empty object here satisfies the check and silences the warning.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  turbopack: {},
}

export default nextConfig
