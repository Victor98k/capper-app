import { useAuth } from "@/hooks/useAuth";

export function useCurrentUser() {
  const { user, loading } = useAuth();
  return { userId: user?.id, loading };
}
