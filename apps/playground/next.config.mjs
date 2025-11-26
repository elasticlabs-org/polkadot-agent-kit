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
  webpack: (config, { isServer }) => {
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
    
    // Configure WASM file handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })
    
    // Externalize Polkadot packages on server to avoid build-time execution
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@polkadot/wasm-crypto': '@polkadot/wasm-crypto',
        '@polkadot/wasm-bridge': '@polkadot/wasm-bridge',
        '@polkadot/wasm-util': '@polkadot/wasm-util',
      })
    }
    
    return config
  },
}

export default nextConfig