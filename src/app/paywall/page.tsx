"use client";

import PaywallComponent from "@/components/paywall";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaywallContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const capperId = searchParams.get("capperId");

  return <PaywallComponent productId={productId} capperId={capperId} />;
}

export default function PaywallPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaywallContent />
    </Suspense>
  );
}
