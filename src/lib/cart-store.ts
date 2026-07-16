import { create } from "zustand";

export type CartItem = {
  productId: string;
  sku: string;
  size: string;
  color: string;
  name: string;
  image: string;  // Cloudinary URL of primary image
  price: number;  // paise — unit price, never mutated after add
  qty: number;    // 1–10
};

export type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string;
  appliedDiscount: number; // paise — 0 until server confirms

  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (sku: string) => void;
  setQty: (sku: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCouponCode: (code: string) => void;
  setAppliedDiscount: (discount: number) => void;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  couponCode: "",
  appliedDiscount: 0,

  addItem: (item) =>
    set((state) => {
      const idx = state.items.findIndex((i) => i.sku === item.sku);
      if (idx !== -1) {
        const items = [...state.items];
        items[idx] = { ...items[idx], qty: Math.min(items[idx].qty + 1, 10) };
        return { items };
      }
      return { items: [...state.items, { ...item, qty: 1 }] };
    }),

  removeItem: (sku) =>
    set((state) => ({ items: state.items.filter((i) => i.sku !== sku) })),

  setQty: (sku, qty) => {
    if (qty === 0) {
      get().removeItem(sku);
    } else {
      set((state) => ({
        items: state.items.map((i) => (i.sku === sku ? { ...i, qty } : i)),
      }));
    }
  },

  clearCart: () => set({ items: [], couponCode: "", appliedDiscount: 0 }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  setCouponCode: (code) => set({ couponCode: code }),

  setAppliedDiscount: (discount) => set({ appliedDiscount: discount }),
}));
