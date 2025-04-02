/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.app.cappersports.co",
  generateRobotsTxt: true, // (optional) you can disable robots.txt generation
  exclude: ["/api/*", "/admin/*"],
  generateIndexSitemap: false,
};
