export interface Product {
  id: string;
  name: string;
  description: string | null;
  default_price: string;
  unit_amount: number;
  currency: string;
  features: string[];
  hasDiscount?: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountDuration?: "once" | "repeating" | "forever";
  discountDurationInMonths?: number;
  couponId?: string;
  freeCouponId?: string;
}

export interface PaywallComponentProps {
  productId?: string | null;
  capperId?: string | null;
}
