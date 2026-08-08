"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

interface CartWishlistContextType {
  cartCount: number;
  wishlistCount: number;
  wishlistedIds: Set<string>;
  refreshCartCount: () => Promise<void>;
  refreshWishlistCount: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  addToCart: (productId: string, size: string, quantity?: number) => Promise<boolean>;
}

const CartWishlistContext = createContext<CartWishlistContextType>({
  cartCount: 0,
  wishlistCount: 0,
  wishlistedIds: new Set(),
  refreshCartCount: async () => {},
  refreshWishlistCount: async () => {},
  toggleWishlist: async () => false,
  addToCart: async () => false,
});

export function CartWishlistProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  const refreshCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/cart/count", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.count || 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, [getHeaders]);

  const refreshWishlistCount = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/wishlist", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setWishlistCount(data.count || 0);
        const ids = new Set<string>((data.products || []).map((p: any) => p.id));
        setWishlistedIds(ids);
      }
    } catch (e) {
      console.error(e);
    }
  }, [getHeaders]);

  useEffect(() => {
    refreshCartCount();
    refreshWishlistCount();
  }, [refreshCartCount, refreshWishlistCount, user]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    const isCurrently = wishlistedIds.has(productId);
    const method = isCurrently ? "DELETE" : "POST";
    const url = isCurrently ? `/api/v1/wishlist/${productId}` : "/api/v1/wishlist";

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: method === "POST" ? JSON.stringify({ productId }) : undefined,
      });
      if (res.ok) {
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          if (isCurrently) next.delete(productId);
          else next.add(productId);
          return next;
        });
        refreshWishlistCount();
        return !isCurrently;
      }
    } catch (e) {
      console.error(e);
    }
    return isCurrently;
  };

  const addToCart = async (productId: string, size: string, quantity = 1): Promise<boolean> => {
    try {
      const res = await fetch("/api/v1/cart/items", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ productId, size, quantity }),
      });
      if (res.ok) {
        refreshCartCount();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return (
    <CartWishlistContext.Provider
      value={{
        cartCount,
        wishlistCount,
        wishlistedIds,
        refreshCartCount,
        refreshWishlistCount,
        toggleWishlist,
        addToCart,
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  );
}

export const useCartWishlist = () => useContext(CartWishlistContext);
