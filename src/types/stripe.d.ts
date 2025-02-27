export interface Product {
  id: string;
  name: string;
  description: string | null;
  default_price: string;
  unit_amount: number;
  currency: string;
  features: string[];
}

export interface PaywallComponentProps {
  productId?: string | null;
  capperId?: string | null;
}
