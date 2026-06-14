import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmStore {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((confirmed: boolean) => void) | null;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  options: { title: "" },
  resolve: null,

  openConfirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    }),

  handleConfirm: () => {
    get().resolve?.(true);
    set({ isOpen: false, resolve: null });
  },

  handleCancel: () => {
    get().resolve?.(false);
    set({ isOpen: false, resolve: null });
  },
}));
