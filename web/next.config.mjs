/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Linting runs as its own CI step (`npm run lint`); keep it out of the build so
  // a lint warning never blocks producing a deployable artifact.
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        // Allow the widget to be embedded in any iframe
        source: "/widget/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
