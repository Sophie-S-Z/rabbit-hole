/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Tone.js uses Web Audio API — not available server-side
      config.externals = [...(config.externals || []), 'tone'];
    }
    return config;
  },
};
module.exports = nextConfig;
