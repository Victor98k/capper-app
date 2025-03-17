/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
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
};

export default nextConfig;
