/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  api: {
    bodyParser: {
      sizeLimit: "1mb",
      webhooks: {
        "/api/webhooks/stripe": {
          bodyParser: false, // Disable body parsing for webhook endpoint
        },
      },
    },
  },
  async headers() {
    return [
      {
        source: "/api/webhooks/stripe",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, stripe-signature",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
