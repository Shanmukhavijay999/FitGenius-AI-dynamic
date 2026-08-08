"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Package, CheckCircle2, Truck, RefreshCw, ArrowLeft, MapPin, Sparkles } from "lucide-react";
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

interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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

  const fetchSellerOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/orders/seller/all", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load seller orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      addToast("error", "Error loading orders", "Could not connect to database.");
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchSellerOrders();
  }, [fetchSellerOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        addToast("success", "Order Status Updated", `Order ${orderId} is now "${newStatus}".`);
      }
    } catch (e) {
      addToast("error", "Update Failed", "Could not update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const STATUS_OPTIONS = ["Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-20 space-y-8">
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seller Dashboard</span>
        </Link>

        <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/08 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>Seller Order Fulfilment</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Customer Orders</h1>
            <p className="text-white/50 text-sm mt-1">
              View incoming garment orders and update shipping delivery status.
            </p>
          </div>

          <button
            onClick={fetchSellerOrders}
            className="p-2.5 glass border border-white/10 hover:border-white/20 rounded-xl text-white/60 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass rounded-3xl p-6 border border-white/08 animate-pulse space-y-4">
                <div className="h-6 bg-white/10 rounded-lg w-1/4" />
                <div className="h-16 bg-white/05 rounded-xl" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-white/08 text-center max-w-lg mx-auto my-12">
            <h3 className="text-xl font-bold mb-2">No Customer Orders Yet</h3>
            <p className="text-white/50 text-sm">
              Orders placed by customers for your uploaded garments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="glass-strong rounded-3xl p-6 border border-white/08 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/08 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-white font-mono">{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40 block mt-0.5">
                      Placed: {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60 font-bold">Update Status:</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className="bg-zinc-900 border border-purple-500/40 text-purple-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-400"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="glass p-3 rounded-2xl border border-white/05 flex items-center gap-4">
                      <img src={item.imageUrl} alt={item.productName} className="w-14 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white">{item.productName}</h4>
                        <span className="text-[10px] text-purple-300 font-bold">Size: {item.size} • Quantity: {item.quantity}</span>
                      </div>
                      <div className="text-right text-xs font-extrabold text-white">
                        ₹{item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-white/60 pt-2 border-t border-white/05 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Customer Shipping Address:</strong> {order.shippingAddress}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
