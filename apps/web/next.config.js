const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Ensures monorepo packages (packages/shared) are included in the standalone bundle
    outputFileTracingRoot: path.join(__dirname, "../../"),
    serverActions: { allowedOrigins: ["localhost:3000", "proxoria.com"] },
  },
  env: {
    API_URL: process.env.API_URL || "http://localhost:3001",
  },
};

module.exports = nextConfig;
