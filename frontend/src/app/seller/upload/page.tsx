"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Upload, Sparkles, CheckCircle2, ArrowRight, ArrowLeft,
  RotateCcw, Scale, Info, Cpu, Database, Eye,
  FileImage, X, Shirt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SizeEntry {
  size: string;
  chest_cm: number;
  shoulder_cm: number;
  length_cm: number;
  waist_cm: number;
  hip_cm: number;
}

interface SizeChart {
  chart_id: string;
  garment_name: string;
  garment_type: string;
  fabric_type: string;
  fit_style: string;
  sizes: SizeEntry[];
  ai_insight: string;
  generated_at: string;
  source: string;
}

// ─── Processing stages ───────────────────────────────────────────────────────
const STAGES = [
  { icon: Eye,      label: "Scanning garment image",        pct: 20 },
  { icon: Cpu,      label: "Extracting measurements via AI", pct: 45 },
  { icon: Database, label: "Building size chart",            pct: 75 },
  { icon: CheckCircle2, label: "Finalizing results",         pct: 95 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavBar({ user }: { user: { name: string } | null }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 glass-strong border-b border-white/08">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">FitGenius</span>
            <span className="text-[9px] text-white/30 uppercase tracking-wider">AI · Seller</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-1.5 border border-white/08">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-white/70">{user.name}</span>
            </div>
          )}
          <Link href="/recommend" className="btn-ghost py-2 px-4 text-sm">
            <Scale className="w-3.5 h-3.5" />
            <span>Find Size</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function DropZone({
  onFile,
  file,
  preview,
}: {
  onFile: (f: File) => void;
  file: File | null;
  preview: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith("image/")) onFile(f);
    },
    [onFile]
  );

  return (
    <motion.div
      className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer
        ${dragging ? "border-indigo-400 bg-indigo-500/08" : "border-white/12 bg-white/02 hover:border-indigo-500/40 hover:bg-white/03"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      whileHover={{ scale: file ? 1 : 1.005 }}
      style={{ minHeight: 320 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center p-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Garment preview"
              className="max-h-72 rounded-2xl object-contain shadow-2xl shadow-black/40"
            />
            <div className="absolute top-4 right-4 flex items-center gap-1.5 glass rounded-full px-3 py-1.5 border border-white/10">
              <FileImage className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-white/60 font-medium truncate max-w-[140px]">
                {file?.name}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-5 py-16 px-8 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"
            >
              <Upload className="w-9 h-9 text-indigo-400" />
            </motion.div>
            <div>
              <p className="text-white/80 font-semibold text-lg mb-1">
                Drop your garment image here
              </p>
              <p className="text-white/35 text-sm">
                PNG, JPG, WebP — flat-lay or product photos work best
              </p>
            </div>
            <div className="glass rounded-full px-5 py-2 border border-white/08 text-xs text-white/40 font-medium">
              or click to browse files
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProcessingView({ stage }: { stage: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main spinner */}
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="relative w-24 h-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-violet-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 rounded-full border-2 border-transparent border-t-pink-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">
            {stage < STAGES.length ? STAGES[stage].label : "Finalizing…"}
          </p>
          <p className="text-white/40 text-sm mt-1">Gemini Vision is analyzing your garment</p>
        </div>
      </div>

      {/* Stage progress */}
      <div className="space-y-3">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const done = i < stage;
          const active = i === stage;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-2xl p-4 transition-all ${
                active ? "glass border border-indigo-500/25 bg-indigo-500/05" :
                done ? "opacity-60" : "opacity-25"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                done ? "bg-emerald-500/15 border border-emerald-500/20" :
                active ? "bg-indigo-500/20 border border-indigo-500/30" :
                "bg-white/04 border border-white/08"
              }`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : "text-white/30"}`} />
                }
              </div>
              <span className={`text-sm font-medium ${active ? "text-white" : done ? "text-white/60" : "text-white/25"}`}>
                {s.label}
              </span>
              {active && (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="ml-auto w-2 h-2 rounded-full bg-indigo-400"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/05 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 rounded-full"
          animate={{ width: `${stage < STAGES.length ? STAGES[stage].pct : 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function SizeChartResult({ chart, onReset }: { chart: SizeChart; onReset: () => void }) {
  const DIM_LABELS: Record<string, string> = {
    chest_cm: "Chest", shoulder_cm: "Shoulder", length_cm: "Length",
    waist_cm: "Waist", hip_cm: "Hip",
  };
  const DIM_ORDER = ["chest_cm", "shoulder_cm", "length_cm", "waist_cm", "hip_cm"];

  // Save chart to localStorage so /recommend can use it
  useEffect(() => {
    localStorage.setItem("fitgenius_chart", JSON.stringify(chart));
  }, [chart]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Success header */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/06 border border-emerald-500/20">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{chart.garment_name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {[chart.garment_type, chart.fabric_type, chart.fit_style].map((tag) => (
              <span key={tag} className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/15 rounded-full px-2 py-0.5">
                {tag}
              </span>
            ))}
            {chart.source === "mock" && (
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/15 rounded-full px-2 py-0.5">
                Demo Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="p-4 rounded-2xl bg-indigo-500/05 border border-indigo-500/15 flex gap-3">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 leading-relaxed">
          <span className="font-semibold text-indigo-300">AI Insight: </span>
          {chart.ai_insight}
        </p>
      </div>

      {/* Size Chart Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/06">
        {/* Header */}
        <div className="grid bg-white/03 border-b border-white/06 px-4 py-3"
          style={{ gridTemplateColumns: `5rem repeat(${DIM_ORDER.length}, 1fr)` }}
        >
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Size</span>
          {DIM_ORDER.map((d) => (
            <span key={d} className="text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">
              {DIM_LABELS[d]}
            </span>
          ))}
        </div>

        {/* Rows */}
        {chart.sizes.map((entry, i) => (
          <motion.div
            key={entry.size}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="grid items-center px-4 py-3.5 border-b border-white/04 last:border-0 hover:bg-white/02 transition-colors"
            style={{ gridTemplateColumns: `5rem repeat(${DIM_ORDER.length}, 1fr)` }}
          >
            <span className="font-bold text-sm text-indigo-300">{entry.size}</span>
            {DIM_ORDER.map((d) => (
              <span key={d} className="text-xs text-white/55 text-center font-mono">
                {(entry as unknown as Record<string, number | string>)[d]}
                <span className="text-white/25"> cm</span>
              </span>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/recommend?chart_id=${chart.chart_id}`}
          className="btn-primary flex-1 py-3.5 text-sm"
        >
          <Scale className="w-4 h-4 relative z-10" />
          <span>Find Customer Size</span>
          <ArrowRight className="w-4 h-4 relative z-10" />
        </Link>
        <button
          onClick={onReset}
          className="btn-ghost py-3.5 px-5 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Upload</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageState = "idle" | "processing" | "done" | "error";

export default function SellerUploadPage() {
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [pageState, setPageState]   = useState<PageState>("idle");
  const [stage, setStage]           = useState(0);
  const [chart, setChart]           = useState<SizeChart | null>(null);
  const [error, setError]           = useState("");
  const [user, setUser]             = useState<{ name: string } | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("fitgenius_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setProductName("");
    setPageState("idle");
    setStage(0);
    setChart(null);
    setError("");
  };

  const handleGenerate = async () => {
    if (!file) return;
    setPageState("processing");
    setStage(0);
    setError("");

    // Animate through stages while the API call is in flight
    const stageInterval = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 900);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (productName.trim()) formData.append("product_name", productName.trim());

      const res = await fetch("/api/v1/size-chart/generate", {
        method: "POST",
        body: formData,
      });

      clearInterval(stageInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail ?? "Failed to generate size chart.");
      }

      const data: SizeChart = await res.json();
      setStage(STAGES.length);
      await new Promise((r) => setTimeout(r, 400)); // brief success pause
      setChart(data);
      setPageState("done");
    } catch (err: unknown) {
      clearInterval(stageInterval);
      setError((err as Error).message ?? "Something went wrong. Please try again.");
      setPageState("error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar user={user} />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-indigo w-[600px] h-[600px] -top-48 -left-32 opacity-20" />
        <div className="orb orb-violet w-[400px] h-[400px] top-1/2 right-0 opacity-15" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      <main className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-medium transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                <Shirt className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest glass border border-indigo-500/20 rounded-full px-3 py-1">
                Seller Dashboard
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Generate{" "}
              <span className="text-gradient">Size Chart</span>
            </h1>
            <p className="text-white/40 mt-3 text-lg leading-relaxed">
              Upload a flat-lay or product photo. Gemini Vision extracts measurements and builds a complete S–2XL size chart in seconds.
            </p>
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong rounded-3xl p-8 border border-white/08 shadow-2xl shadow-indigo-500/05"
          >
            <AnimatePresence mode="wait">
              {pageState === "idle" || pageState === "error" ? (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Drop zone */}
                  <DropZone onFile={handleFile} file={file} preview={preview} />

                  {/* Product name (optional) */}
                  <div className="mt-6">
                    <label className="text-xs font-bold text-white/35 uppercase tracking-widest block mb-2">
                      Product Name <span className="text-white/20 font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Classic Linen Shirt"
                      className="w-full glass rounded-2xl border border-white/08 bg-white/02 px-5 py-4 text-sm text-white/80 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
                    />
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {pageState === "error" && error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-red-500/08 border border-red-500/20"
                      >
                        <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action button */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={!file}
                      className="btn-primary flex-1 py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Sparkles className="w-5 h-5 relative z-10" />
                      <span>Generate Size Chart</span>
                      <ArrowRight className="w-4 h-4 relative z-10" />
                    </button>
                    {file && (
                      <button onClick={handleReset} className="btn-ghost py-4 px-5">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : pageState === "processing" ? (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ProcessingView stage={stage} />
                </motion.div>
              ) : pageState === "done" && chart ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SizeChartResult chart={chart} onReset={handleReset} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {/* Tips */}
          {pageState === "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 grid sm:grid-cols-3 gap-4"
            >
              {[
                { icon: FileImage, title: "Flat-lay works best", desc: "Place garment flat, well-lit, on a neutral background." },
                { icon: Eye,       title: "Include all angles", desc: "Front view is required. Back view improves accuracy." },
                { icon: CheckCircle2, title: "Higher res = better AI", desc: "At least 800×800 px for best measurement extraction." },
              ].map((tip) => (
                <div key={tip.title} className="glass rounded-2xl p-5 border border-white/05">
                  <tip.icon className="w-4 h-4 text-indigo-400 mb-3" />
                  <p className="text-xs font-semibold text-white/70 mb-1">{tip.title}</p>
                  <p className="text-xs text-white/30 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
