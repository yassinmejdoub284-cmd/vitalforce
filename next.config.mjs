import process from "node:process";
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.VITAL_FORCE_BUILD_DIR || ".next",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
