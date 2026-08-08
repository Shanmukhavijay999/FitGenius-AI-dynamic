"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Scale, Sparkles, ArrowLeft, ArrowRight, CheckCircle2,
  RotateCcw, Info, AlertCircle, Upload, Ruler, Shirt,
  Star, User, Check, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, ToastMessage } from "@/components/Toast";

interface SizeEntry {
  size: string;
  chest_cm: number;
  shoulder_cm: number;
  length_cm: number;
  waist_cm: number;
  hip_cm: number;
}

interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  imageUrl: string;
  category: string;
  fabric: string;
  fit: string;
  tags: string[];
  sizeChart: SizeEntry[];
  aiInsight: string;
  rating: number;
  reviewCount: number;
  views: number;
}

interface DimensionScore {
  dimension: string;
  body_cm: number;
  garment_cm: number;
  match_pct: number;
  note: string;
}

interface RecommendResult {
  recommended_size: string;
  confidence_pct: number;
  fit_description: string;
  reason: string;
  dimension_scores: DimensionScore[];
  alternative_size: string | null;
  alternative_note: string | null;
}

function RecommendContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product_id");

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Measurement Inputs
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("70");
  const [chest, setChest] = useState("98");
  const [waist, setWaist] = useState("84");
  const [hip, setHip] = useState("96");
  const [shoulder, setShoulder] = useState("44");

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
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

  // Fetch products from database
  useEffect(() => {
    async function fetchProducts() {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/v1/products");
        if (!res.ok) throw new Error("Failed to load database products");
        const data: Product[] = await res.json();
        setProducts(data);

        if (data.length > 0) {
          if (initialProductId) {
            const found = data.find((p) => p.id === initialProductId);
            setSelectedProduct(found || data[0]);
          } else {
            setSelectedProduct(data[0]);
          }
        }
      } catch (err) {
        console.error(err);
        addToast("error", "Database Error", "Could not fetch products from server.");
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [initialProductId]);

  const handleCalculateFit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setCalculating(true);
    try {
      const res = await fetch("/api/v1/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          height_cm: parseFloat(height) || 175,
          weight_kg: parseFloat(weight) || 70,
          chest_cm: parseFloat(chest) || 98,
          waist_cm: parseFloat(waist) || 84,
          hip_cm: parseFloat(hip) || 96,
          shoulder_cm: parseFloat(shoulder) || 44,
        }),
      });

      if (!res.ok) throw new Error("Calculation failed");
      const data = await res.json();
      setResult(data);
      addToast("success", "Fit Match Calculated!", `Recommended Size: ${data.recommended_size}`);
    } catch (err) {
      console.error(err);
      addToast("error", "Calculation Error", "Failed to compute fit recommendation.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 glass-strong border-b border-white/08">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-none">FitGenius</span>
              <span className="text-[9px] text-purple-400 uppercase tracking-wider">AI Customer Recommendation</span>
            </div>
          </Link>
          <Link href="/seller/upload" className="btn-purple py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Garment</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20 space-y-10">
        {/* Top Product Selector & Selected Garment Banner */}
        {loadingProducts ? (
          <div className="glass rounded-3xl p-8 border border-white/08 animate-pulse flex items-center justify-center">
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
              <span>Fetching database products...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="glass rounded-3xl p-8 border border-white/08 text-center">
            <h3 className="text-lg font-bold mb-2">No Products Available</h3>
            <p className="text-white/50 text-xs mb-4">Upload a product from the seller dashboard first.</p>
            <Link href="/seller/upload" className="btn-purple py-2.5 px-5 text-xs font-semibold rounded-xl inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Go to Seller Upload</span>
            </Link>
          </div>
        ) : (
          selectedProduct && (
            <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Left: Product Info Card */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-28 md:w-32 md:h-36 rounded-2xl overflow-hidden glass border border-white/10 shrink-0">
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-semibold uppercase">
                      {selectedProduct.category}
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                      {selectedProduct.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        Seller: <strong className="text-white">{selectedProduct.sellerName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Shirt className="w-3.5 h-3.5 text-indigo-400" />
                        Fabric: {selectedProduct.fabric}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-pink-400" />
                        Fit: {selectedProduct.fit}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {selectedProduct.rating} ({selectedProduct.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Product Switcher Dropdown */}
                {products.length > 1 && (
                  <div className="w-full lg:w-auto">
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Switch Product
                    </label>
                    <select
                      value={selectedProduct.id}
                      onChange={(e) => {
                        const found = products.find((p) => p.id === e.target.value);
                        if (found) {
                          setSelectedProduct(found);
                          setResult(null);
                        }
                      }}
                      className="w-full lg:w-64 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* AI Insight banner */}
              {selectedProduct.aiInsight && (
                <div className="mt-6 pt-6 border-t border-white/08 text-xs text-white/70 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">AI Insight:</strong> {selectedProduct.aiInsight}</p>
                </div>
              )}
            </div>
          )
        )}

        {/* Input Form & Recommendation Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Body Measurement Form */}
          <div className="lg:col-span-5">
            <div className="glass-strong rounded-3xl p-6 border border-white/08 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Your Body Measurements</h2>
                  <p className="text-xs text-white/50">Enter specs to calculate AI size match</p>
                </div>
              </div>

              <form onSubmit={handleCalculateFit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      required
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      required
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Chest (cm)
                    </label>
                    <input
                      type="number"
                      required
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Waist (cm)
                    </label>
                    <input
                      type="number"
                      required
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Hip (cm)
                    </label>
                    <input
                      type="number"
                      required
                      value={hip}
                      onChange={(e) => setHip(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Shoulder (cm)
                    </label>
                    <input
                      type="number"
                      required
                      value={shoulder}
                      onChange={(e) => setShoulder(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={calculating || !selectedProduct}
                  className="btn-purple w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-purple-500/20"
                >
                  {calculating ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Analyzing Dimensions...
                    </span>
                  ) : (
                    <>
                      <Scale className="w-4 h-4" />
                      <span>Find Your Perfect Size</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Visual Matching & Recommendation Output */}
          <div className="lg:col-span-7 space-y-6">
            {!result ? (
              <div className="glass-strong rounded-3xl p-10 border border-white/08 text-center flex flex-col items-center justify-center h-full min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Scale className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2">Ready for Fit Analysis</h3>
                <p className="text-xs text-white/50 max-w-sm">
                  Enter your body measurements on the left and click "Find Your Perfect Size" to get instant AI size recommendations with animated visual matching.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Recommendation Summary Card with Visual Side-by-Side */}
                  <div className="glass-strong rounded-3xl p-6 md:p-8 border border-purple-500/40 bg-purple-950/20 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Uploaded Garment Image */}
                      {selectedProduct && (
                        <div className="w-36 h-44 rounded-2xl overflow-hidden glass border border-white/10 shrink-0 relative group">
                          <img
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                            <span className="text-[10px] font-bold text-white truncate">{selectedProduct.name}</span>
                          </div>
                        </div>
                      )}

                      {/* Recommendation Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                            Recommended Size
                          </span>
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            {result.confidence_pct}% Confidence
                          </span>
                        </div>

                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl font-black text-white tracking-tight">
                            {result.recommended_size}
                          </span>
                          <span className="text-sm font-semibold text-purple-300">
                            — {result.fit_description}
                          </span>
                        </div>

                        {/* Detailed Reasons */}
                        <div className="text-xs text-white/80 whitespace-pre-line leading-relaxed bg-black/40 p-3.5 rounded-2xl border border-white/05 font-mono">
                          {result.reason}
                        </div>

                        {/* Alternative Size note */}
                        {result.alternative_size && (
                          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between">
                            <span>
                              <strong>Alternative Size:</strong> {result.alternative_size}
                            </span>
                            <span className="text-[11px] opacity-80">{result.alternative_note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* VISUAL MATCHING: Interactive Size Chart with Highlighted Animated Row */}
                  {selectedProduct && selectedProduct.sizeChart && (
                    <div className="glass-strong rounded-3xl p-6 border border-white/08 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Visual Size Chart Match</span>
                        </h3>
                        <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                          ✓ Size {result.recommended_size} Row Highlighted
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-white/40 uppercase">
                              <th className="py-2.5 px-3">Size</th>
                              <th className="py-2.5 px-3">Chest (cm)</th>
                              <th className="py-2.5 px-3">Shoulder (cm)</th>
                              <th className="py-2.5 px-3">Length (cm)</th>
                              <th className="py-2.5 px-3">Waist (cm)</th>
                              <th className="py-2.5 px-3">Hip (cm)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/05">
                            {selectedProduct.sizeChart.map((row, idx) => {
                              const isMatched = row.size === result.recommended_size;
                              return (
                                <motion.tr
                                  key={idx}
                                  animate={
                                    isMatched
                                      ? { backgroundColor: "rgba(168, 85, 247, 0.25)" }
                                      : { backgroundColor: "rgba(255, 255, 255, 0.01)" }
                                  }
                                  className={`transition-colors ${
                                    isMatched ? "border-l-4 border-l-purple-500 font-bold" : ""
                                  }`}
                                >
                                  <td className="py-3 px-3">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                        isMatched
                                          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                                          : "bg-white/05 text-white/70"
                                      }`}
                                    >
                                      {row.size}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-3 ${isMatched ? "text-purple-200 font-bold" : "text-white/70"}`}>
                                    {row.chest_cm}
                                  </td>
                                  <td className={`py-3 px-3 ${isMatched ? "text-purple-200 font-bold" : "text-white/70"}`}>
                                    {row.shoulder_cm}
                                  </td>
                                  <td className={`py-3 px-3 ${isMatched ? "text-purple-200 font-bold" : "text-white/70"}`}>
                                    {row.length_cm}
                                  </td>
                                  <td className={`py-3 px-3 ${isMatched ? "text-purple-200 font-bold" : "text-white/70"}`}>
                                    {row.waist_cm}
                                  </td>
                                  <td className={`py-3 px-3 ${isMatched ? "text-purple-200 font-bold" : "text-white/70"}`}>
                                    {row.hip_cm}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RecommendPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-12">Loading...</div>}>
      <RecommendContent />
    </Suspense>
  );
}
