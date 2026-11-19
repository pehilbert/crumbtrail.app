// Runs at build time. VERCEL_ENV is 'production' for main, 'preview' for every other branch.
const apiOrigin =
  process.env.VERCEL_ENV === 'production'
    ? 'https://crumbtrail-api.vercel.app'
    : 'https://crumbtrail-api-preview.vercel.app';

export const config = {
  outputDirectory: 'dist/web/browser',
  rewrites: [
    // Same idea as proxy.conf.json in dev: the browser only ever talks to the app's own origin.
    { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
    // SPA fallback so deep links like /recipes/123 load the app.
    { source: '/(.*)', destination: '/index.html' },
  ],
};