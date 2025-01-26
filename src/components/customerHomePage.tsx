"use client";

import { SideNav } from "@/components/SideNav";
import MyCappers from "@/app/My-cappers/page";
import { CappersSidebar } from "@/components/CappersSidebar";

export function CustomerHomepageComponent() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Left Sidebar - Sticky */}
      <SideNav />

      {/* Main Content */}
      <div className="flex-1 flex justify-center mr-72">
        <main className="w-full max-w-3xl px-4 py-6 ">
          <div className="mx-4">
            <MyCappers />
          </div>
        </main>
      </div>

      {/* Right Sidebar - Fixed */}
      <div className="fixed right-0 top-0 h-screen w-80 hidden lg:block flex-shrink-0 ml-20">
        <CappersSidebar />
      </div>
    </div>
  );
}

export default CustomerHomepageComponent;
