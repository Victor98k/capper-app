// import { Redis } from "@upstash/redis";

// const redis = new Redis({
//   url: process.env.REDIS_URL!,
//   token: process.env.REDIS_TOKEN!,
// });

// export async function rateLimit(userId: string, limit = 5, window = 60) {
//   const key = `ratelimit:${userId}`;
//   const count = await redis.incr(key);

//   if (count === 1) {
//     await redis.expire(key, window);
//   }

//   return {
//     isAllowed: count <= limit,
//     remaining: Math.max(0, limit - count),
//   };
// }
