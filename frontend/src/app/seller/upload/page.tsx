"use client";

import React, { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload, Sparkles, CheckCircle2, ArrowRight, ArrowLeft,
  RotateCcw, Scale, Info, Cpu, Database, Eye,
  FileImage, X, Shirt, Tag, Calendar, User, ExternalLink
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

interface SizeChartResult {
  chart_id: string;
  garment_name: string;
  garment_type: string;
  fabric_type: string;
  fit_style: string;
  sizes: SizeEntry[];
  ai_insight: string;
  generated_at: string;
}

interface SavedProduct {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  fabric: string;
  fit: string;
  sizeChart: SizeEntry[];
  aiInsight: string;
  createdAt: string;
}

const STAGES = [
  { icon: Eye, label: "Scanning garment image", pct: 25 },
  { icon: Cpu, label: "Extracting structural specs", pct: 55 },
  { icon: Database, label: "Building size chart matrix", pct: 85 },
  { icon: CheckCircle2, label: "Saving product to database", pct: 100 },
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("T-Shirt");
  const [fabric, setFabric] = useState("100% Organic Heavyweight Cotton (240 GSM)");
  const [fit, setFit] = useState("Relaxed Oversized Fit");
  const [tagsInput, setTagsInput] = useState("Premium, Oversized, Streetwear");

  // Workflow State
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [savedProduct, setSavedProduct] = useState<SavedProduct | null>(null);

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

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    if (!name) {
      const baseName = f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleGenerateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !preview) {
      addToast("error", "Image Required", "Please upload a garment photo first.");
      return;
    }
    if (!name.trim()) {
      addToast("error", "Name Required", "Please enter a product name.");
      return;
    }

    setIsProcessing(true);
    setStageIdx(0);
    setProgress(15);

    try {
      // Step 1: Request AI size chart generation
      setStageIdx(1);
      setProgress(45);

      const resGen = await fetch("/api/v1/size-chart/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          fabric: fabric.trim(),
          fit: fit.trim(),
        }),
      });

      if (!resGen.ok) throw new Error("AI Size Chart Generation failed");
      const chartData: SizeChartResult = await resGen.json();

      setStageIdx(2);
      setProgress(75);

      // Step 2: Upload product & save to permanent database
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("name", name.trim());
      formData.append("seller_id", "usr-seller-001");
      formData.append("seller_name", "Apex Apparel Studio");
      formData.append("category", category);
      formData.append("fabric", fabric.trim());
      formData.append("fit", fit.trim());
      formData.append(
        "tags",
        JSON.stringify(tagsInput.split(",").map((t) => t.trim()).filter(Boolean))
      );
      formData.append("size_chart", JSON.stringify(chartData.sizes));
      formData.append("ai_insight", chartData.ai_insight);

      setStageIdx(3);
      setProgress(95);

      const resProd = await fetch("/api/v1/products", {
        method: "POST",
        body: formData,
      });

      if (!resProd.ok) throw new Error("Failed to save product in database");
      const prodResult = await resProd.json();

      setProgress(100);
      setSavedProduct(prodResult);
      addToast("success", "Product Saved Permanently!", `"${name}" is now stored in database.`);
    } catch (err: any) {
      console.error(err);
      addToast("error", "Processing Failed", err.message || "Could not complete upload.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setName("");
    setSavedProduct(null);
    setProgress(0);
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
              <span className="text-[9px] text-purple-400 uppercase tracking-wider">AI Seller Studio</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/seller/products" className="btn-purple py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>My Products</span>
            </Link>
            <Link href="/recommend" className="btn-ghost py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Customer Size Tool</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20">
        {!savedProduct ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Garment Analyzer</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Upload Garment Image</h1>
              <p className="text-white/50 text-sm mt-1">
                Upload your apparel photo to generate an automated AI size chart and permanently save it to the store database.
              </p>
            </div>

            <form onSubmit={handleGenerateAndSave} className="space-y-8">
              {/* Image Dropzone */}
              <div className="glass-strong rounded-3xl p-8 border border-white/10 text-center relative overflow-hidden group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />

                {preview ? (
                  <div className="relative w-full max-w-xs mx-auto h-64 rounded-2xl overflow-hidden glass border border-white/20">
                    <img src={preview} alt="Garment preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleReset}
                      className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/70 text-white/80 hover:text-white z-30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 py-8 pointer-events-none">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto transition-transform group-hover:scale-110">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">
                        Drag & Drop garment photo or <span className="text-purple-400 underline">Browse</span>
                      </h3>
                      <p className="text-xs text-white/40">Supports JPG, PNG, WEBP up to 15MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Garment Details Inputs */}
              <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-purple-400" />
                  <span>Garment Specifications</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Minimalist Obsidian Oversized Tee"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="T-Shirt">T-Shirt</option>
                        <option value="Shirt">Shirt</option>
                        <option value="Hoodie">Hoodie</option>
                        <option value="Jacket">Jacket</option>
                        <option value="Sweatshirt">Sweatshirt</option>
                        <option value="Dress">Dress</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                        Fit Style
                      </label>
                      <input
                        type="text"
                        value={fit}
                        onChange={(e) => setFit(e.target.value)}
                        placeholder="e.g. Relaxed Oversized Fit, Slim Fit"
                        className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">
                      Fabric Material & Weight
                    </label>
                    <input
                      type="text"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="e.g. 100% Organic Heavyweight Cotton (240 GSM)"
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Processing Progress Bar */}
                {isProcessing && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-purple-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        {STAGES[stageIdx]?.label || "Processing..."}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-purple w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-2xl shadow-xl shadow-purple-500/20"
                >
                  {isProcessing ? (
                    <span>Processing AI Size Chart & Saving...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AI Size Chart & Save to DB</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Automatically Display Generated Product & Confirmation */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Banner */}
            <div className="glass-strong rounded-3xl p-6 border border-emerald-500/40 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-300">Product Successfully Uploaded & Saved!</h3>
                  <p className="text-xs text-emerald-200/70">Permanently available in the database and store catalogue.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/seller/products"
                  className="btn-purple py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>View in My Products</span>
                </Link>
                <button
                  onClick={handleReset}
                  className="btn-ghost py-2 px-3 text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Upload Another</span>
                </button>
              </div>
            </div>

            {/* Generated Product Display */}
            <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-8">
                {/* Image */}
                <div className="sm:col-span-5">
                  <div className="w-full h-72 rounded-2xl overflow-hidden glass border border-white/10">
                    <img
                      src={savedProduct.imageUrl}
                      alt={savedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="sm:col-span-7 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400">{savedProduct.category}</span>
                    <h2 className="text-2xl font-bold text-white">{savedProduct.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="glass p-3 rounded-xl border border-white/05">
                      <span className="text-[9px] uppercase font-bold text-white/40 block">Fabric</span>
                      <span className="font-semibold text-white">{savedProduct.fabric}</span>
                    </div>
                    <div className="glass p-3 rounded-xl border border-white/05">
                      <span className="text-[9px] uppercase font-bold text-white/40 block">Fit Style</span>
                      <span className="font-semibold text-white">{savedProduct.fit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Created {new Date(savedProduct.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">✓ Database Stored</span>
                  </div>

                  {savedProduct.aiInsight && (
                    <div className="glass p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 text-xs text-white/80">
                      <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Insight</span>
                      </div>
                      <p>{savedProduct.aiInsight}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Size Chart Table */}
              <div className="space-y-3 pt-6 border-t border-white/10">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Generated Size Chart Matrix</span>
                </h3>

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
                    <tbody className="divide-y divide-white/05 font-medium">
                      {savedProduct.sizeChart?.map((s, idx) => (
                        <tr key={idx} className="hover:bg-white/05">
                          <td className="py-3 px-3 font-bold text-purple-300">{s.size}</td>
                          <td className="py-3 px-3 text-white/80">{s.chest_cm}</td>
                          <td className="py-3 px-3 text-white/80">{s.shoulder_cm}</td>
                          <td className="py-3 px-3 text-white/80">{s.length_cm}</td>
                          <td className="py-3 px-3 text-white/80">{s.waist_cm}</td>
                          <td className="py-3 px-3 text-white/80">{s.hip_cm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
