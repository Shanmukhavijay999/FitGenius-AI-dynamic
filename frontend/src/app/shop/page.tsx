"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, ShoppingBag, Sparkles,
  RefreshCw, Filter, Shirt, Scale, X, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { ToastContainer, ToastMessage } from "@/components/Toast";

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
  sizes?: string[];
  recommendedSize?: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [fitFilter, setFitFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const addToast = (type: "success" | "error" | "info", title: string, description?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchShopProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (category !== "All") queryParams.set("category", category);
      if (sizeFilter !== "All") queryParams.set("size", sizeFilter);
      if (fitFilter !== "All") queryParams.set("fit", fitFilter);
      if (minPrice) queryParams.set("min_price", minPrice);
      if (maxPrice) queryParams.set("max_price", maxPrice);
      queryParams.set("sort", sort);

      const res = await fetch(`/api/v1/shop?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load store catalogue");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      addToast("error", "Error loading products", "Could not connect to database.");
    } finally {
      setLoading(false);
    }
  }, [search, category, sizeFilter, fitFilter, minPrice, maxPrice, sort]);

  useEffect(() => {
    fetchShopProducts();
  }, [fetchShopProducts]);

  const categories = ["All", "T-Shirt", "Shirt", "Hoodie", "Jacket", "Sweatshirt", "Dress"];
  const sizes = ["All", "XS", "S", "M", "L", "XL", "2XL"];
  const fits = ["All", "Relaxed Oversized Fit", "Regular Fit", "Slim Fit", "Tailored Fit"];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-4">
        <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/08 relative overflow-hidden bg-gradient-to-r from-purple-950/20 via-black to-indigo-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Real Seller Products</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Fashion Catalogue</h1>
              <p className="text-white/50 text-sm mt-1 max-w-xl">
                Explore garments uploaded by top sellers. Select your measurements or ask our AI Shopping Assistant for your perfect size match.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/recommend" className="btn-purple py-3 px-5 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-500/20">
                <Scale className="w-4 h-4" />
                <span>Find My Perfect Size</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-20">
        {/* Controls Bar (Search, Category Tabs, Sort) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 my-6">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search garments by name, category, fabric, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/05 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  category === cat
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                    : "glass text-white/60 hover:text-white border border-white/05"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort & Filter Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={`py-2.5 px-4 rounded-2xl glass border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors ${
                filterDrawerOpen ? "border-purple-500 text-purple-300 bg-purple-500/10" : "text-white/80 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="popular">Sort: Most Popular</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Filter Drawer / Panel */}
        <AnimatePresence>
          {filterDrawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass-strong rounded-3xl p-6 border border-purple-500/30 mb-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/08 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-400" />
                  <span>Filter Products</span>
                </h3>
                <button
                  onClick={() => {
                    setCategory("All");
                    setSizeFilter("All");
                    setFitFilter("All");
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                  className="text-xs text-purple-400 hover:underline font-semibold"
                >
                  Reset All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                {/* Category Select */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Size Select */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Available Size</label>
                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {sizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Fit Style Select */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Fit Silhouette</label>
                  <select
                    value={fitFilter}
                    onChange={(e) => setFitFilter(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {fits.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Price Range (₹)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-white/30">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass rounded-3xl p-4 border border-white/08 animate-pulse space-y-4">
                <div className="w-full h-64 rounded-2xl bg-white/05" />
                <div className="h-5 bg-white/10 rounded-lg w-3/4" />
                <div className="h-4 bg-white/05 rounded-lg w-1/2" />
                <div className="h-9 bg-white/10 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass rounded-3xl p-12 border border-white/08 text-center max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
              <Shirt className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Products Found</h3>
            <p className="text-white/50 text-sm mb-6">
              No garments match your current search or filter criteria. Try resetting filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setSizeFilter("All");
                setFitFilter("All");
                setMinPrice("");
                setMaxPrice("");
              }}
              className="btn-purple py-3 px-6 text-sm font-semibold inline-flex items-center gap-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Search Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onToast={(type, title, desc) => addToast(type, title, desc)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
