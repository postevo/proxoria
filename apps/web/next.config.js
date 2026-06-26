/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ["localhost:3000"] } },
  env: {
    API_URL: process.env.API_URL || "http://localhost:3001",
  },
};

module.exports = nextConfig;
