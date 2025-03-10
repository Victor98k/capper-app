import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in environment variables");
}

// Add retry logic for rate limits
const stripeWithRetry = (stripeInstance: Stripe) => {
  const maxRetries = 3;
  const baseDelay = 1000;

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
                // Exponential backoff: 1s, 2s, 4s
                await new Promise((resolve) =>
                  setTimeout(resolve, baseDelay * Math.pow(2, attempt))
                );
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

export const stripe = stripeWithRetry(
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia", // Use the latest API version
    typescript: true,
  })
);
