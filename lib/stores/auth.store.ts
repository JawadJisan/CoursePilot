import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth } from "@/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";

interface AuthState {
  user: {
    uid: string;
    email: string;
    name: string;
    expiresAt: string;
  } | null;
  logoutTimer: NodeJS.Timeout | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  scheduleLogout: (expiresAt: Date) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      logoutTimer: null,
      login: async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const idToken = await userCredential.user.getIdToken();

        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
          credentials: "include",
        });

        if (!res.ok) throw new Error("Login failed");

        const data = await res.json();
        console.log("login res:", data);
        set({ user: data.data });
        get().scheduleLogout(new Date(data.data.expiresAt));
      },
      logout: async () => {
        await auth.signOut();
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        set({ user: null });
        if (get().logoutTimer) clearTimeout(get().logoutTimer!);
      },
      refreshSession: async () => {
        await auth.currentUser?.getIdToken(true);
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken || !auth.currentUser) throw new Error("Not authenticated");

        // Refresh session cookie
        const refreshRes = await fetch(
          "http://localhost:5000/api/auth/refresh",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
            credentials: "include",
          }
        );

        // Get updated user data
        const userRes = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });

        if (!userRes.ok) throw new Error("Failed to fetch user");

        const { data: userData } = await userRes.json();
        console.log("userData:", userData);
        const { data: refreshData } = await refreshRes.json();
        console.log("refreshData:", refreshData);

        set({
          user: {
            ...userData,
            expiresAt: refreshData.expiresAt,
          },
        });
        get().scheduleLogout(new Date(refreshData.expiresAt));
      },
      fetchUser: async () => {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const { data } = await res.json();
          console.log("res me data:", data);
          set({ user: data });
        }
      },
      scheduleLogout: (expiresAt) => {
        const timeUntilExpiration = expiresAt.getTime() - Date.now() - 30000;
        if (timeUntilExpiration > 0) {
          if (get().logoutTimer) clearTimeout(get().logoutTimer!);
          set({
            logoutTimer: setTimeout(() => get().logout(), timeUntilExpiration),
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
