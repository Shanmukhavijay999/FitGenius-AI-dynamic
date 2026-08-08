"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowRight, Sparkles, Shirt } from "lucide-react";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { ToastContainer, ToastMessage } from "@/components/Toast";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  fabric: string;
  fit: string;
  price: number;
  discountPrice?: number;
  rating: number | string;
  reviewCount: number;
  sizes?: string[];
  wishlistedAt?: string;
}

export default function WishlistPage() {
  const { token } = useAuth();
  const { refreshWishlistCount, addToCart } = useCartWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, description?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/wishlist", { headers });
      if (!res.ok) throw new Error("Failed to load wishlist");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      addToast("error", "Error loading wishlist", "Could not fetch saved items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [token]);

  const handleRemove = async (productId: string, name: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/wishlist/${productId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        refreshWishlistCount();
        addToast("info", "Removed from Wishlist", `"${name}" was removed.`);
      }
    } catch (err) {
      addToast("error", "Failed to remove item", "Try again later.");
    }
  };

  const handleAddToCart = async (product: Product, size: string) => {
    const ok = await addToCart(product.id, size, 1);
    if (ok) {
      addToast("success", "Added to Cart 🛒", `Size ${size} • "${product.name}"`);
    } else {
      addToast("error", "Add to Cart failed", "Could not update cart.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-20 space-y-8">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/08 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>Saved Items</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">My Wishlist</h1>
            <p className="text-white/50 text-sm mt-1">
              Your saved favorite garments. Add them to cart whenever you are ready.
            </p>
          </div>

          <Link href="/shop" className="btn-purple py-2.5 px-5 text-xs font-bold rounded-2xl inline-flex items-center gap-2">
            <span>Explore Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-3xl p-4 border border-white/08 animate-pulse space-y-4">
                <div className="w-full h-64 rounded-2xl bg-white/05" />
                <div className="h-5 bg-white/10 rounded-lg w-3/4" />
                <div className="h-4 bg-white/05 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-white/08 text-center max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Your Wishlist is Empty</h3>
            <p className="text-white/50 text-sm mb-6">
              Browse our fashion store and click the heart icon on any product to save it here.
            </p>
            <Link href="/shop" className="btn-purple py-3 px-6 text-sm font-semibold inline-flex items-center gap-2 rounded-xl">
              <Shirt className="w-4 h-4" />
              <span>Browse Garments</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const displayPrice = p.discountPrice || p.price;
              const mrp = p.price > displayPrice ? p.price : Math.round(displayPrice * 1.35);

              return (
                <div
                  key={p.id}
                  className="glass-strong rounded-3xl p-4 border border-white/08 hover:border-rose-500/30 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Image */}
                    <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-4 bg-zinc-900">
                      <Link href={`/products/${p.id}`}>
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      <button
                        onClick={() => handleRemove(p.id, p.name)}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 backdrop-blur-md text-rose-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1.5 mb-4">
                      <span className="text-[10px] uppercase font-bold text-purple-400">{p.category}</span>
                      <Link href={`/products/${p.id}`} className="block">
                        <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                      </Link>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-extrabold text-white">₹{displayPrice.toLocaleString()}</span>
                        {mrp > displayPrice && (
                          <span className="text-xs text-white/40 line-through">₹{mrp.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/08">
                    <button
                      onClick={() => handleAddToCart(p, p.sizes?.[0] || "M")}
                      className="btn-purple py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                    <Link
                      href={`/products/${p.id}`}
                      className="py-2 px-3 rounded-xl glass border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1"
                    >
                      <span>View</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
