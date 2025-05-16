"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";

export const withAuth = (Component: React.ComponentType) => {
  return function ProtectedRoute(props: any) {
    const router = useRouter();
    const { user, fetchUser } = useAuthStore();

    useEffect(() => {
      const verifySession = async () => {
        if (!user) {
          try {
            await fetchUser();
          } catch {
            router.push("/login");
          }
        }
      };
      verifySession();
    }, [router.pathname]);

    return user ? <Component {...props} /> : null;
  };
};
