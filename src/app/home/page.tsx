"use client";

import { useAuth } from "@/hooks/useAuth";
import { SuperUserDashboard } from "@/components/SuperUserDashboard";
import CustomerHome from "@/components/customerHomePage";
import Loader from "@/components/Loader";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Render SuperUser dashboard if the user is a superuser
  if (user?.isSuperUser) {
    return <SuperUserDashboard />;
  }

  // Regular users
  return (
    <>
      <CustomerHome />
    </>
  );
}
