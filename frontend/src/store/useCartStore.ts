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

export interface AppliedPromo {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
}

interface CartState {
  items: CartItem[];
  appliedPromo: AppliedPromo | null;
  addItem: (item: CartItemInput) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemVariant: (oldId: string, newItem: CartItem) => void;
  clearCart: () => void;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
}

const getMaximumQuantity = (stock?: number) => Math.max(1, Math.min(stock || 10, 5));

const clampQuantity = (quantity: number, stock?: number) => {
  const safeQuantity = isNaN(quantity) ? 1 : quantity;
  return Math.max(1, Math.min(safeQuantity, getMaximumQuantity(stock)));
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      appliedPromo: null,
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
      updateItemVariant: (oldId, newItem) => set((state) => {
        const itemIndex = state.items.findIndex((item) => item.id === oldId);
        if (itemIndex === -1) return state;
        
        // Also check if the new ID already exists elsewhere in the cart (e.g. they changed capacity to one they already had)
        const existingNewIdIndex = state.items.findIndex(item => item.id === newItem.id);
        
        if (existingNewIdIndex !== -1 && existingNewIdIndex !== itemIndex) {
          // If it exists, merge them!
          const newItems = [...state.items];
          const combinedQuantity = clampQuantity(
            newItems[existingNewIdIndex].quantity + newItems[itemIndex].quantity, 
            newItem.stock
          );
          
          newItems[existingNewIdIndex] = {
            ...newItems[existingNewIdIndex],
            quantity: combinedQuantity
          };
          
          // Remove the old one
          newItems.splice(itemIndex, 1);
          return { items: newItems };
        }

        const newItems = [...state.items];
        newItems[itemIndex] = newItem;
        return { items: newItems };
      }),
      clearCart: () => set({ items: [], appliedPromo: null }),
      setAppliedPromo: (promo) => set({ appliedPromo: promo }),
    }),
    {
      name: 'phone-store-cart',
    },
  ),
);