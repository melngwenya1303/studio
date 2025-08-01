
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
   experimental: {
    // This allows the Next.js dev server to accept requests from the
    // Firebase Studio preview window.
    allowedDevOrigins: ['https://*.cloudworkstations.dev'],
    // Disabling PPR is a temporary workaround for a bug in Next.js 15
    // that causes issues with some libraries.
    ppr: false,
  },
};

export default nextConfig;
