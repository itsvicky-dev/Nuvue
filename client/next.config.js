/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'res.cloudinary.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos'
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  
  // Configuration to avoid build issues
  swcMinify: true,
  
  // Completely disable output file tracing to prevent stack overflow
  output: 'standalone',
  
  // Experimental features to help with build issues
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
        'node_modules/sharp/**/*',
      ],
    },
    // Disable build worker to reduce memory usage
    workerThreads: false,
  },
  
  // Optimize build performance and reduce memory usage
  webpack: (config, { isServer, dev }) => {
    // Only apply optimizations in production builds
    if (!dev) {
      // Reduce memory usage during build
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Common chunk
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      };
      
      // Limit the number of chunks to prevent build issues
      config.optimization.splitChunks.maxSize = 244000;
    }
    
    return config;
  },
}

module.exports = nextConfig