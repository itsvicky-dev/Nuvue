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
  // Server Actions are enabled by default in Next.js 14
  // experimental.serverActions option removed as it's deprecated
  
  // Optimize build process
  swcMinify: true,
  
  // Configure output for better deployment
  output: 'standalone',
  
  // Reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

module.exports = nextConfig