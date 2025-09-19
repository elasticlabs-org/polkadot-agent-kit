/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Enable WebAssembly used by downstream SDK deps
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
      layers: true,
    }
    // Declare async function support to satisfy asyncWebAssembly
    config.output = {
      ...(config.output || {}),
      environment: {
        ...(config.output?.environment || {}),
        asyncFunction: true,
      },
    }
    return config
  },
}

export default nextConfig