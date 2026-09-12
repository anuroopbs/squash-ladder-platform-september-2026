/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Hyderabad and Secunderabad were merged into one city ("Secunderabad/Hyderabad")
  // on 2026-09-12, keeping the "hyderabad" slug as the surviving URL. These
  // redirects keep any old /secunderabad links working instead of 404ing.
  async redirects() {
    return [
      {
        source: "/secunderabad",
        destination: "/hyderabad",
        permanent: true,
      },
      {
        source: "/secunderabad/:clubSlug",
        destination: "/hyderabad/:clubSlug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
