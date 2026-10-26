import type { NextConfig } from "next";

// The site is static and loads nothing from third parties, so the policy can be strict.
// 'unsafe-inline' covers the theme bootstrap, JSON-LD and Next's inline payloads; a
// nonce would force every request to render dynamically.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // Dev needs eval for fast refresh, so the strict policy only ships in production.
    if (process.env.NODE_ENV !== "production") return [];
    return [
      { source: "/:path*", headers: securityHeaders },
      // The CSP skips PDFs: the browser's built-in PDF viewer can be blocked by it.
      {
        source: "/:path((?!.*\\.pdf$).*)",
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }],
      },
    ];
  },
};

export default nextConfig;
