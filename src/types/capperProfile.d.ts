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
  socialLinks?: Record<string, string>;
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
  }[];
};
