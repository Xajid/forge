import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://preview-chat-6278c956-ae18-427a-88c7-7c3e1c4312c0.space-z.ai",
  ],
};

export default nextConfig;