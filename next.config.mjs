/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    domains: [
      'imagedelivery.net', // Farcaster profile images
      'i.imgur.com',       // Common image hosting
      'res.cloudinary.com', // Another common CDN
      'tba-mobile.mypinata.cloud' // Pinata IPFS gateway
    ],
  },
};

export default nextConfig;
