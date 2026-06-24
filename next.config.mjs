

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('./package.json');

const nextConfig = {
  env: {
    APP_VERSION: version,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      // Naver Shopping CDN patterns
      { protocol: "https", hostname: "shopping-phinf.pstatic.net" },
      { protocol: "https", hostname: "shop-phinf.pstatic.net" },
      { protocol: "https", hostname: "**.phinf.naver.net" },
      // Common Korean e-commerce CDNs
      { protocol: "https", hostname: "thumbnail.coupangcdn.com" },
      { protocol: "https", hostname: "**.ssgcdn.com" },
    ],
    unoptimized: true,
  },
  webpack: (config) => {
    // '@apps-in-toss/web-framework' is only available inside the Toss mini-app shell at runtime.
    // Mark it as external so webpack skips bundling it; the real SDK is injected by the host env.
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      ({ request }, callback) => {
        if (request === '@apps-in-toss/web-framework') {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
    ];
    return config;
  },
};

export default nextConfig;
