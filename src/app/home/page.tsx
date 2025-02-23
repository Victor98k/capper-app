"use client";

import { useAuth } from "@/hooks/useAuth";
import { SuperUserDashboard } from "@/components/SuperUserDashboard";
import CustomerHome from "@/components/customerHomePage";
import Loader from "@/components/Loader";

export default function Home() {
  const { user, loading } = useAuth();

  // console.log("User data:", user);
  // console.log("Is super user:", user?.isSuperUser);

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

  // Your existing home page content for regular users
  return (
    <>
      <CustomerHome />
    </>
  );
}
