/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.app.cappersports.co",
  generateRobotsTxt: true, // (optional) you can disable robots.txt generation
  exclude: ["/api/*", "/api/**"], // Exclude all API routes
  generateIndexSitemap: false,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        disallow: ["/api/"], // Explicitly disallow crawling of API routes
      },
    ],
  },
};
