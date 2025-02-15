"use client";

import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "./SideNavCappers";

export function SuperUserDashboard() {
  const { user } = useAuth();

  if (!user?.isSuperUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <SideNav />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Super User Dashboard
        </h1>

        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">
            Capper Applications
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="text-gray-300 border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4">John Doe</td>
                  <td className="py-3 px-4">johndoe</td>
                  <td className="py-3 px-4">john@example.com</td>
                  <td className="py-3 px-4">
                    <button className="bg-green-600 text-white px-3 py-1 rounded-md mr-2 hover:bg-green-700">
                      Accept
                    </button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700">
                      Deny
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
