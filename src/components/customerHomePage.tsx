"use client";

import { SideNav } from "@/components/SideNav";
import MyCappers from "@/app/My-cappers/page";
import { CappersSidebar } from "@/components/CappersSidebar";
import Image from "next/image";
import logo from "@/images/Cappers Logga (1).svg";
import Loader from "@/components/Loader";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Consider data fresh for 1 minute
      gcTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
    },
  },
});

export function CustomerHomepageComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#020817] text-gray-100">
        {/* Mobile Top Nav - Sticky */}
        <div className="sticky top-0 z-50 w-full bg-gray-900 border-b border-gray-800 p-4 flex items-center lg:hidden">
          {/* Left side - Menu */}
          <div className="absolute left-4">
            <SideNav />
          </div>

          {/* Center - Logo */}
          <div className="flex-1 flex justify-center">
            <Image
              src={logo}
              alt="Cappers Logo"
              width={120}
              height={40}
              priority
            />
          </div>
        </div>

        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <SideNav />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex justify-center mr-0 lg:mr-72">
            <main className="w-full lg:max-w-3xl px-0 lg:px-4 py-6">
              <div className="mx-0 lg:mx-4">
                <Suspense fallback={<Loader />}>
                  <MyCappers />
                </Suspense>
              </div>
            </main>
          </div>

          {/* Right Sidebar - Fixed */}
          <div className="fixed right-0 top-0 h-screen w-80 hidden lg:block flex-shrink-0 ml-20">
            <CappersSidebar />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default CustomerHomepageComponent;
