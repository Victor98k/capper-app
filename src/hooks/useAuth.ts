// React hook for handling authentication state and user data throughout the application
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// User interface defining the shape of user data returned from the API
interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isCapper: boolean; // Indicates if user is a sports handicapper
  stripeConnectOnboarded: boolean; // Indicates if user has completed Stripe onboarding
  isSuperUser: boolean; // Indicates admin privileges
}

// useAuth hook: Manages authentication state and provides user data
export function useAuth() {
  // State for storing user data and loading status
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Effect runs on component mount to fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        // Attempts to fetch the current user's data from the API
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        // Redirects to login page if not authenticated
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  // Returns user data and loading state for use in components
  return { user, loading };
}
