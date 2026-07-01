/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Send the root path to the login page at the routing layer.
      // A prerendered redirect() in app/page.tsx shipped an empty Location
      // header on the Netlify Next runtime; this rule emits a proper 307.
      {
        source: '/',
        destination: '/auth/login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
