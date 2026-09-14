import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  brand: string;
  name: string;
  image: string;
  variantId: string;
  sku: string;
  colorName: string;
  storageLabel: string;
  price: number;
  originalPrice?: number;
  stock: number;
  quantity: number;
}

export type CartItemInput = Omit<CartItem, 'id' | 'quantity'> & {
  quantity: number;
};

interface CartState {
  items: CartItem[];
  addItem: (item: CartItemInput) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const getMaximumQuantity = (stock: number) => Math.max(1, Math.min(stock, 5));

const clampQuantity = (quantity: number, stock: number) => (
  Math.max(1, Math.min(quantity, getMaximumQuantity(stock)))
);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const id = item.productId + ':' + item.variantId;
        const existingItem = state.items.find((cartItem) => cartItem.id === id);

        if (existingItem) {
          return {
            items: state.items.map((cartItem) => (
              cartItem.id === id
                ? {
                    ...cartItem,
                    quantity: clampQuantity(cartItem.quantity + item.quantity, item.stock),
                    stock: item.stock,
                    price: item.price,
                    originalPrice: item.originalPrice,
                    image: item.image,
                  }
                : cartItem
            )),
          };
        }

        return {
          items: [
            ...state.items,
            {
              ...item,
              id,
              quantity: clampQuantity(item.quantity, item.stock),
            },
          ],
        };
      }),
      updateQuantity: (itemId, quantity) => set((state) => ({
        items: state.items.map((item) => (
          item.id === itemId
            ? { ...item, quantity: clampQuantity(quantity, item.stock) }
            : item
        )),
      })),
      removeItem: (itemId) => set((state) => ({
        items: state.items.filter((item) => item.id !== itemId),
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'phone-store-cart',
    },
  ),
);