"use client";

import { SideNav } from "@/components/SideNav";

function MyBets() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <SideNav />

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-8">
        <div className="lg:mt-0 mt-8">
          <h2 className="text-2xl font-bold mb-4">My Bets</h2>
          {/* Add your My Bets content here */}
        </div>
      </main>
    </div>
  );
}

export default MyBets;
