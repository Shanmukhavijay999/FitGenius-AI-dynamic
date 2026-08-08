"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowRight,
  ShieldCheck, Sparkles, Tag, ArrowLeft, Shirt
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { ToastContainer, ToastMessage } from "@/components/Toast";

interface CartItem {
  id: string;
  productId: string;
  size: string;
  quantity: number;
  price: number;
  mrp: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    fit: string;
    brand: string;
  };
}

interface CartData {
  cartId: string;
  itemCount: number;
  totalMrp: number;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  items: CartItem[];
}

export default function CartPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { refreshCartCount } = useCartWishlist();

  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, description?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cart", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load cart");
      const data: CartData = await res.json();
      setCartData(data);
    } catch (err) {
      console.error(err);
      addToast("error", "Error loading cart", "Could not fetch cart items.");
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (itemId: string, newQty: number) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ quantity: newQty }),
      });

      if (res.ok) {
        await fetchCart();
        refreshCartCount();
      }
    } catch (e) {
      addToast("error", "Update failed", "Could not update quantity.");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: string, productName: string) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (res.ok) {
        await fetchCart();
        refreshCartCount();
        addToast("info", "Item Removed", `"${productName}" removed from cart.`);
      }
    } catch (e) {
      addToast("error", "Deletion failed", "Could not remove item.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-20 space-y-8">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/08 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Checkout Ready</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Shopping Cart</h1>
            <p className="text-white/50 text-sm mt-1">
              Review selected garments, sizes, and quantities before proceeding to checkout.
            </p>
          </div>

          <Link href="/shop" className="btn-ghost py-2.5 px-5 text-xs font-bold rounded-2xl inline-flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="glass rounded-3xl p-8 border border-white/08 animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded-lg w-1/3" />
            <div className="h-24 bg-white/05 rounded-2xl" />
            <div className="h-24 bg-white/05 rounded-2xl" />
          </div>
        ) : !cartData || cartData.items.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-white/08 text-center max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Your Cart is Empty</h3>
            <p className="text-white/50 text-sm mb-6">
              Looks like you haven't added any garments to your cart yet.
            </p>
            <Link href="/shop" className="btn-purple py-3 px-6 text-sm font-semibold inline-flex items-center gap-2 rounded-xl">
              <Shirt className="w-4 h-4" />
              <span>Explore Shop</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cartData.items.map((item) => (
                <div
                  key={item.id}
                  className="glass-strong rounded-3xl p-4 sm:p-6 border border-white/08 flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-purple-400">
                        {item.product.category}
                      </span>
                      <h3 className="text-base font-bold text-white line-clamp-1">{item.product.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>Fit: {item.product.fit}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                          Size: {item.size}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-white pt-1">
                        ₹{item.price.toLocaleString()}
                        {item.mrp > item.price && (
                          <span className="text-xs text-white/40 line-through ml-2">
                            ₹{item.mrp.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity controls + Subtotal + Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-white/08">
                    {/* Qty Buttons */}
                    <div className="flex items-center gap-2 glass p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updatingId === item.id}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingId === item.id}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 uppercase font-bold block">Subtotal</span>
                      <span className="text-sm font-extrabold text-purple-300">
                        ₹{item.subtotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item.id, item.product.name)}
                      disabled={updatingId === item.id}
                      className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary & Checkout CTA */}
            <div className="lg:col-span-4">
              <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6 sticky top-24">
                <h3 className="text-lg font-bold border-b border-white/10 pb-4">Order Summary</h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-white/60">
                    <span>Total MRP</span>
                    <span className="font-mono">₹{cartData.totalMrp.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Bag Discount</span>
                    <span className="font-mono">- ₹{cartData.discount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-white/60">
                    <span>Delivery Fee</span>
                    <span className="font-mono">
                      {cartData.deliveryCharge === 0 ? (
                        <span className="text-emerald-400 font-bold uppercase">FREE</span>
                      ) : (
                        `₹${cartData.deliveryCharge}`
                      )}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex justify-between text-base font-extrabold text-white">
                    <span>Total Payable</span>
                    <span className="text-purple-300 font-mono">
                      ₹{cartData.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {cartData.subtotal < 1999 && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    Add <strong>₹{(1999 - cartData.subtotal).toLocaleString()}</strong> more to get FREE express delivery!
                  </div>
                )}

                <button
                  onClick={() => router.push("/checkout")}
                  className="btn-purple w-full py-4 text-sm font-extrabold flex items-center justify-center gap-2 rounded-2xl shadow-xl shadow-purple-500/30"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-white/40 pt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Razorpay Verified Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
