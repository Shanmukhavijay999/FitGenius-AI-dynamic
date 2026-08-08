"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package, CheckCircle2, Clock, Truck, ShoppingBag,
  ArrowRight, ShieldCheck, Calendar, MapPin, Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ToastContainer, ToastMessage } from "@/components/Toast";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  brand: string;
  imageUrl: string;
  size: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderTimeline {
  status: string;
  completed: boolean;
  current: boolean;
}

interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  discount: number;
  deliveryCharge: number;
  status: string;
  statusIndex: number;
  timeline: OrderTimeline[];
  shippingAddress: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/orders", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      addToast("error", "Error loading orders", "Could not fetch order history.");
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-20 space-y-8">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/08 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>Real Database Orders</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">My Orders</h1>
            <p className="text-white/50 text-sm mt-1">
              Track delivery status, view items, and check payment verification details.
            </p>
          </div>

          <Link href="/shop" className="btn-purple py-2.5 px-5 text-xs font-bold rounded-2xl inline-flex items-center gap-2">
            <span>Shop More Garments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="glass rounded-3xl p-6 border border-white/08 animate-pulse space-y-4">
                <div className="h-6 bg-white/10 rounded-lg w-1/4" />
                <div className="h-20 bg-white/05 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-white/08 text-center max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Orders Found</h3>
            <p className="text-white/50 text-sm mb-6">
              You haven't placed any orders yet. Add products to cart and checkout to create your first order.
            </p>
            <Link href="/shop" className="btn-purple py-3 px-6 text-sm font-semibold inline-flex items-center gap-2 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Shop</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="glass-strong rounded-3xl p-6 border border-white/08 hover:border-purple-500/30 transition-all space-y-6"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/08 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-white font-mono">{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">
                        {order.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-white/40 uppercase font-bold block">Total Amount</span>
                    <span className="text-lg font-black text-white font-mono">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Status Timeline Bar */}
                <div className="bg-white/02 p-4 rounded-2xl border border-white/05">
                  <span className="text-[10px] uppercase font-bold text-white/40 block mb-3">Order Status Progress</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    {order.timeline.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                            step.completed
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                              : "glass text-white/30 border border-white/10"
                          }`}
                        >
                          {step.completed ? "✓" : idx + 1}
                        </div>
                        <span
                          className={`text-[9px] font-semibold ${
                            step.current ? "text-purple-300 font-bold" : step.completed ? "text-white/80" : "text-white/30"
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items in Order */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="glass p-3 rounded-2xl border border-white/05 flex items-center gap-4">
                      <img src={item.imageUrl} alt={item.productName} className="w-14 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white">{item.productName}</h4>
                        <p className="text-[10px] text-white/50">{item.brand} • {item.category}</p>
                        <span className="text-[10px] text-purple-300 font-bold">Size: {item.size} • Qty: {item.quantity}</span>
                      </div>
                      <div className="text-right text-xs font-extrabold text-white">
                        ₹{item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Address */}
                <div className="text-xs text-white/60 pt-2 border-t border-white/05 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Shipping Address:</strong> {order.shippingAddress}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
