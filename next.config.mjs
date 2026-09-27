/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // صور الأغلفة تُرفع عبر Server Actions، والحد الافتراضي 1MB
    serverActions: { bodySizeLimit: "3mb" },
  },
};
export default nextConfig;
