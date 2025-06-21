export type CapperProfile = {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
    stripeConnectId: string;
  };
  bio?: string;
  title?: string;
  imageUrl?: string;
  profileImage?: string;
  tags: string[];
  subscriberIds: string[];
  socialLinks?: {
    instagram?: { username: string; url: string };
    x?: { username: string; url: string };
    discord?: { username: string; url: string };
    whatsapp?: { username: string; url: string };
    youtube?: { username: string; url: string };
  };
  products: {
    id: string;
    name: string;
    description: string | null;
    default_price: {
      id: string;
      recurring: PriceRecurring | null;
      unit_amount: number;
      currency: string;
      type: "one_time" | "recurring";
    };
    marketing_features: string[];
    hasDiscount?: boolean;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    discountDuration?: "once" | "repeating" | "forever";
    discountDurationInMonths?: number;
    couponId?: string;
    freeCouponId?: string;
  }[];
  roi: number;
  winrate: number;
};
