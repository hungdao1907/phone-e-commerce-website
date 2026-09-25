import { create } from 'zustand';

interface WishlistState {
  items: string[];
  setItems: (items: string[]) => void;
  syncWithBackend: (token: string) => Promise<void>;
  toggleItem: (productId: string, token?: string) => Promise<boolean>;
  hasItem: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  
  syncWithBackend: async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wishlist/ids`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const ids = await res.json();
        set({ items: ids });
      }
    } catch (error) {
      console.error('Lỗi đồng bộ wishlist:', error);
    }
  },

  toggleItem: async (productId: string, token?: string) => {
    if (!token) {
      // Return false indicating it needs auth
      return false; 
    }

    // Optimistic UI update
    const prevItems = get().items;
    const isAdded = !prevItems.includes(productId);
    
    set({
      items: isAdded 
        ? [...prevItems, productId] 
        : prevItems.filter(id => id !== productId)
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wishlist/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ productId })
      });
      
      if (!res.ok) {
        // Revert on error
        set({ items: prevItems });
        return true; // Still authenticated, but failed
      }
    } catch (error) {
      console.error('Lỗi cập nhật wishlist:', error);
      set({ items: prevItems });
    }
    
    return true; // Authenticated and processed
  },

  hasItem: (productId) => get().items.includes(productId),
}));
