/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Foursquare photo CDN
      { protocol: "https", hostname: "fastly.4sqi.net" },
      { protocol: "https", hostname: "*.4sqi.net" },
    ],
  },
};

export default nextConfig;
