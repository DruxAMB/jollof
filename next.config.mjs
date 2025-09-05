/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net', // Farcaster profile images
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // Common image hosting
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Another common CDN
      },
      {
        protocol: 'https',
        hostname: 'tba-mobile.mypinata.cloud', // Pinata IPFS gateway
      },
    ],
  },
};

export default nextConfig;
