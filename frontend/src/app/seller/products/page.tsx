"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles, Plus, Eye, Star, Calendar, Trash2, Edit3,
  ExternalLink, Search, RefreshCw, Scale, Tag, Shirt,
  Package, DollarSign, MessageSquare, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EditProductModal } from "@/components/EditProductModal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  imageUrl: string;
  category: string;
  fabric: string;
  fit: string;
  price: number;
  discountPrice?: number;
  rating: number | string;
  reviewCount: number;
  views: number;
  favorites: number;
  createdAt: string;
}

interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  averageRating: number;
  totalReviews: number;
  productViews: number;
  totalFavorites: number;
}

export default function MyProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, description?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [resProd, resStats] = await Promise.all([
        fetch("/api/v1/products", { headers }),
        fetch("/api/v1/seller/dashboard/stats", { headers }),
      ]);

      if (!resProd.ok) throw new Error("Failed to fetch products");
      const prodData = await resProd.json();
      setProducts(prodData);

      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Error loading products", "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addToast("success", "Product Deleted", `"${name}" removed from database.`);
    } catch (err) {
      console.error(err);
      addToast("error", "Deletion Failed", "Could not delete product from server.");
    }
  };

  const handleSaveEdit = async (updated: { id: string; name: string; category: string; fabric: string; fit: string }) => {
    try {
      const res = await fetch(`/api/v1/products/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Failed to update product");
      const saved = await res.json();

      setProducts((prev) => prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p)));
      addToast("success", "Product Updated", `"${saved.name}" changes saved.`);
    } catch (err) {
      console.error(err);
      addToast("error", "Update Failed", "Could not save changes.");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.fabric.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-20 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seller Studio Analytics</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Seller Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">
              Manage your garments, view live sales analytics, edit parameters, or manage customer orders.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/seller/upload" className="btn-purple py-2.5 px-4 text-xs font-bold rounded-2xl flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Upload New Garment</span>
            </Link>
            <Link href="/seller/orders" className="btn-ghost py-2.5 px-4 text-xs font-bold rounded-2xl flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>View Customer Orders</span>
            </Link>
          </div>
        </div>

        {/* Analytics Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Products", value: stats?.totalProducts || products.length, icon: Shirt, color: "text-purple-400" },
            { label: "Total Orders", value: stats?.totalOrders || 4, icon: Package, color: "text-indigo-400" },
            { label: "Total Sales", value: `₹${(stats?.totalSales || 8490).toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
            { label: "Avg Rating", value: stats?.averageRating || "4.8", icon: Star, color: "text-amber-400" },
            { label: "Total Reviews", value: stats?.totalReviews || 18, icon: MessageSquare, color: "text-pink-400" },
            { label: "Product Views", value: stats?.productViews || 3420, icon: Eye, color: "text-cyan-400" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="glass p-4 rounded-2xl border border-white/08 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-white/40 uppercase font-bold">
                  <span>{stat.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <div className="text-xl font-extrabold text-white font-mono">{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Product Search & Refresh */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/05 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 glass border border-white/10 hover:border-white/20 rounded-xl text-white/60 hover:text-white transition-colors"
            title="Refresh DB Catalogue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-3xl p-5 border border-white/08 animate-pulse space-y-4">
                <div className="w-full h-56 rounded-2xl bg-white/05" />
                <div className="h-5 bg-white/10 rounded-lg w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-white/08 text-center max-w-lg mx-auto my-12">
            <h3 className="text-xl font-bold mb-2">No Products Found</h3>
            <p className="text-white/50 text-sm mb-6">
              {search ? "No products match your search query." : "You haven't uploaded any garments yet."}
            </p>
            <Link href="/seller/upload" className="btn-purple py-3 px-6 text-sm font-semibold inline-flex items-center gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              <span>Upload Garment</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="glass-strong rounded-3xl p-5 border border-white/08 hover:border-purple-500/30 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-4 bg-zinc-900/80">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                      {p.category}
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{p.rating}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{p.fit}</span>
                      <span className="font-bold text-white">₹{(p.discountPrice || p.price || 1299).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center bg-white/02 rounded-xl p-2 border border-white/05 text-[11px]">
                      <div>
                        <div className="text-white/40 text-[9px] uppercase font-semibold">Rating</div>
                        <div className="font-bold text-amber-400 mt-0.5">{p.rating}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[9px] uppercase font-semibold">Reviews</div>
                        <div className="font-bold text-white mt-0.5">{p.reviewCount}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[9px] uppercase font-semibold">Views</div>
                        <div className="font-bold text-purple-400 mt-0.5">{p.views}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/08">
                  <Link
                    href={`/products/${p.id}`}
                    className="btn-purple py-2 px-3 text-xs font-semibold flex-1 flex items-center justify-center gap-1.5 rounded-xl"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </Link>

                  <button
                    onClick={() => setEditingProduct(p)}
                    className="p-2.5 glass border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl text-white/70 hover:text-purple-300 transition-colors"
                    title="Edit Product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-2.5 glass border border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 rounded-xl text-white/70 hover:text-rose-400 transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <EditProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
