"use client";

import PaywallComponent from "@/components/paywall";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loader from "@/components/Loader";

// NOT USED ATM
function PaywallContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const capperId = searchParams.get("capperId");

  return <PaywallComponent productId={productId} capperId={capperId} />;
}

export default function PaywallPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PaywallContent />
    </Suspense>
  );
}
