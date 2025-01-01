"use client";

import { SideNav } from "@/components/SideNav";
import MyCappers from "@/app/My-cappers/page";
import { CappersSidebar } from "@/components/CappersSidebar";

export function CustomerHomepageComponent() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Left Sidebar - Fixed */}
      <div className="fixed left-0 top-0 h-screen w-64 flex-shrink-0">
        <SideNav />
      </div>

      {/* Main Content - With margin to account for fixed sidebars */}
      <main className="flex-1 ml-64 mr-80 overflow-y-auto">
        <MyCappers />
      </main>

      {/* Right Sidebar - Fixed */}
      <div className="fixed right-0 top-0 h-screen w-80 hidden lg:block flex-shrink-0">
        <CappersSidebar />
      </div>
    </div>
  );
}

export default CustomerHomepageComponent;
