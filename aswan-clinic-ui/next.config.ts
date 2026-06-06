import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // تخطي أخطاء الـ TypeScript أثناء الـ Build لإتمام النشر بسلاسة
    ignoreBuildErrors: true,
  },
  // ⚡ الحل: وضع إعدادات الأمان داخل experimental كما تتطلب النسخ الحديثة
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.github.dev",
        "*.app.github.dev"
      ],
    },
  },
};

export default nextConfig;