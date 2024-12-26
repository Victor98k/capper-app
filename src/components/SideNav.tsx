"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  Home,
  Compass,
  Heart,
  TicketIcon,
  BarChart3,
  Settings,
} from "lucide-react";

export function SideNav() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted (client-side)
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white p-4 space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-start"
        size="lg"
        onClick={() => router.push("/home")}
      >
        <Home className="h-5 w-5 mr-3" />
        Home
      </Button>
      {/* Rest of your buttons */}
    </div>
  );
}

export default SideNav;
