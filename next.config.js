/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://127.0.0.1:28100/api/:path*',
      },
    ]
  },
  webpack: (config) => {
    config.resolve.alias['@'] = '/'
    return config
  },
}

module.exports = nextConfig
