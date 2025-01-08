/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = '/'
    return config
  },
}

module.exports = nextConfig
