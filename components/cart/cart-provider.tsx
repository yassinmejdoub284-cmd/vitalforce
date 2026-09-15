"use client";

import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products } from "@/lib/product-data";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((cartItem) => cartItem.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.productId === item.productId
                  ? { ...cartItem, price: item.price, quantity: cartItem.quantity + quantity }
                  : cartItem
              )
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity < 1
            ? state.items.filter((item) => item.productId !== productId)
            : state.items.map((item) => (item.productId === productId ? { ...item, quantity } : item))
        })),
      clear: () => set({ items: [] })
    }),
    {
      name: "vital-force-cart",
      merge: (persistedState, currentState) => {
        const saved = persistedState as Partial<CartState>;
        return {
          ...currentState,
          ...saved,
          items: (saved.items ?? []).filter((item) => products.some((entry) => entry.id === item.productId)).map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            return product ? { ...item, price: product.price } : item;
          })
        };
      }
    }
  )
);

export function CartProvider({ children }: { children: ReactNode }) {
  return children;
}
