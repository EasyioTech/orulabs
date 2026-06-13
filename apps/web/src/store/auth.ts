import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@oruclass/types";

interface AuthState {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  emailVerified: boolean;
  setUser: (user: PublicUser | null, isAuthenticated?: boolean) => void;
  setEmailVerified: (verified: boolean) => void;
  clearUser: () => void;
  setSessionExpired: (expired: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isSessionExpired: false,
      emailVerified: false,
      setUser: (user, isAuthenticated = true) =>
        set({ user, isAuthenticated: user !== null && isAuthenticated, isSessionExpired: false }),
      setEmailVerified: (verified) => set({ emailVerified: verified }),
      clearUser: () =>
        set({ user: null, isAuthenticated: false, isSessionExpired: false, emailVerified: false }),
      setSessionExpired: (expired) =>
        set((state) => ({
          isSessionExpired: expired,
          isAuthenticated: expired ? false : state.isAuthenticated,
        })),
    }),
    { name: "oruclass-auth" },
  ),
);
