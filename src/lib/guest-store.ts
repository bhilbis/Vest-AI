import { create } from "zustand";

interface GuestState {
  isGuest: boolean;
  guestId: string | null;
  guestName: string;
  loginAsGuest: () => void;
  logoutGuest: () => void;
  _hydrated: boolean;
  hydrate: () => void;
}

const GUEST_KEY = "vest-ai-guest";

function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useGuestStore = create<GuestState>((set) => ({
  isGuest: false,
  guestId: null,
  guestName: "Guest User",
  _hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(GUEST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          isGuest: data.isGuest ?? false,
          guestId: data.guestId ?? null,
          guestName: data.guestName ?? "Guest User",
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },

  loginAsGuest: () => {
    const guestId = generateGuestId();
    const guestData = { isGuest: true, guestId, guestName: "Guest User" };
    localStorage.setItem(GUEST_KEY, JSON.stringify(guestData));
    set({ ...guestData });
  },

  logoutGuest: () => {
    localStorage.removeItem(GUEST_KEY);
    set({ isGuest: false, guestId: null, guestName: "Guest User" });
  },
}));
