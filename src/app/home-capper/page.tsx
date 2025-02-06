"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CapperDashboard } from "@/components/capperDashboard";
import { Suspense } from "react";
import Loader from "@/components/Loader";

function HomeCapperContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  useEffect(() => {
    if (success) {
      console.log("Successfully connected Stripe account!");
    }
    if (refresh) {
      window.location.reload();
    }
  }, [success, refresh]);

  return <CapperDashboard />;
}

export default function HomeCapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Loader />
        </div>
      }
    >
      <HomeCapperContent />
    </Suspense>
  );
}
