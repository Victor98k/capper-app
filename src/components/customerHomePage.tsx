"use client";

import { SideNav } from "@/components/SideNav";

export function CustomerHomepageComponent() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-8">
        <div className="lg:mt-0 mt-8">
          {/* Add your new home page content here */}
        </div>
      </main>
    </div>
  );
}

export default CustomerHomepageComponent;
