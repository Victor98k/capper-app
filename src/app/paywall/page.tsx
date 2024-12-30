"use client";

import PaywallComponent from "@/components/paywall";
import { useSearchParams } from "next/navigation";

export default function PaywallPage() {
  // Use Next.js useSearchParams hook instead of window.location
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const capperId = searchParams.get("capperId");

  return <PaywallComponent productId={productId} capperId={capperId} />;
}
