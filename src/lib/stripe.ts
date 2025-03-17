import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in environment variables");
}

// Add retry logic for rate limits
const stripeWithRetry = (stripeInstance: Stripe) => {
  const maxRetries = 3;
  const baseDelay = 2000; // Increased from 1000 to 2000ms

  const handler = {
    get(target: any, prop: string) {
      if (typeof target[prop] === "function") {
        return async (...args: any[]) => {
          let attempt = 0;
          while (attempt < maxRetries) {
            try {
              return await target[prop](...args);
            } catch (error: any) {
              if (
                error.type === "StripeRateLimitError" &&
                attempt < maxRetries - 1
              ) {
                attempt++;
                // Exponential backoff with jitter: 2s, 4s, 8s + random
                const jitter = Math.random() * 1000;
                const delay = baseDelay * Math.pow(2, attempt) + jitter;
                console.warn(
                  `Rate limit hit, retrying in ${delay}ms (attempt ${attempt})`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
              }
              throw error;
            }
          }
        };
      }
      return target[prop];
    },
  };

  return new Proxy(stripeInstance, handler);
};

// Configure Stripe with better timeout and max retries
export const stripe = stripeWithRetry(
  new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    timeout: 30000, // Increase timeout to 30s
    maxNetworkRetries: 2, // Add built-in retries
  })
);

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};
