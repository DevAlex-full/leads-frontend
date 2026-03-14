/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expõe a URL do backend para o browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
