"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { auth } from "@/firebase/client";

let refreshDebounce: NodeJS.Timeout;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshSession, logout, fetchUser } = useAuthStore();

  // Sync Firebase auth state with backend
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Sync with backend data
        await fetchUser();
      } else {
        logout();
      }
    });
    return () => unsubscribe();
  }, []);

  // Activity-based session refresh
  useEffect(() => {
    const handleActivity = () => {
      if (user && Date.now() > new Date(user.expiresAt).getTime() - 300000) {
        clearTimeout(refreshDebounce);
        refreshDebounce = setTimeout(refreshSession, 60000);
      }
    };

    const events = ["mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    return () =>
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
  }, [user]);

  // Global error handling
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401) {
        logout();
        window.location.href = "/login";
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  return <>{children}</>;
}
