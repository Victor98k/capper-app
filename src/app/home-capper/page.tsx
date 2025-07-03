"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Components
import { CapperDashboard } from "@/components/capperDashboard";
import { Suspense } from "react";
import Loader from "@/components/Loader";
import { SideNav as SideNavCappers } from "@/components/SideNavCappers";

function HomeCapperContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  useEffect(() => {
    if (success) {
      // console.log("Successfully connected Stripe account!");
    }
    if (refresh) {
      window.location.reload();
    }
  }, [success, refresh]);

  return <CapperDashboard />;
}

export default function HomeCapper() {
  return (
    <>
      {/* Mobile Top Nav */}
      <div className="lg:hidden sticky top-0 z-50 w-full bg-[#020817] p-4 flex items-center">
        <div className="absolute left-4">
          <SideNavCappers />
        </div>
        <div className="flex-1 text-right pr-4">
          <h2 className="text-xl font-semibold">Product Dashboard</h2>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Loader />
          </div>
        }
      >
        <HomeCapperContent />
      </Suspense>
    </>
  );
}
