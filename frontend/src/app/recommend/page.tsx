"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Scale, Sparkles, ArrowLeft, ArrowRight, CheckCircle2,
  RotateCcw, Info, AlertCircle, Upload,
  Ruler,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  ai_explanation: string;
  dimension_scores: DimensionScore[];
  alternative_size: string | null;
  alternative_note: string | null;
}

interface StoredChart {
  chart_id: string;
  garment_name: string;
  garment_type: string;
  fit_style: string;
  fabric_type: string;
  sizes: {
    size: string;
    chest_cm: number;
    shoulder_cm: number;
    length_cm: number;
    waist_cm: number;
    hip_cm: number;
  }[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 glass-strong border-b border-white/08">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">FitGenius</span>
            <span className="text-[9px] text-white/30 uppercase tracking-wider">AI · Customer</span>
          </div>
        </Link>
        <Link href="/seller/upload" className="btn-ghost py-2 px-4 text-sm">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Garment</span>
        </Link>
      </div>
    </header>
  );
}

function MeasurementInput({
  label, value, onChange, unit = "cm", min, max, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; min?: number; max?: number; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{
          borderColor: focused ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)",
          boxShadow:   focused ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl border bg-white/02"
        style={{ borderWidth: 1 }}
      >
        <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            placeholder={placeholder ?? "—"}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-white text-base font-semibold font-mono px-4 pt-7 pb-3 outline-none"
          />
          <span className="pr-4 text-sm font-medium text-white/25 flex-shrink-0">{unit}</span>
        </div>
      </motion.div>
    </div>
  );
}

function ConfidenceRing({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const color =
    pct >= 90 ? "#34d399" :
    pct >= 75 ? "#a5b4fc" :
    pct >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl font-black text-white"
        >
          {pct.toFixed(0)}%
        </motion.div>
        <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mt-0.5">
          Confidence
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result, garmentName }: { result: RecommendResult; garmentName: string }) {
  const noteColor = (note: string) => {
    if (note.toLowerCase().includes("perfect")) return "text-emerald-400";
    if (note.toLowerCase().includes("snug") || note.toLowerCase().includes("slightly"))
      return "text-amber-400";
    if (note.toLowerCase().includes("tight") || note.toLowerCase().includes("loose"))
      return "text-red-400";
    return "text-white/40";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Hero result */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-600/15 to-violet-600/10 border border-indigo-500/25">
        <div className="orb orb-indigo w-48 h-48 -top-12 -right-12 opacity-20 pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
              Recommended Size
            </p>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
              className="text-8xl font-black text-white tracking-tighter leading-none mb-3"
            >
              {result.recommended_size}
            </motion.div>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              {result.fit_description}
            </p>
            {result.alternative_size && (
              <p className="mt-3 text-xs text-white/35">
                <span className="text-amber-300 font-semibold">Alt: Size {result.alternative_size}</span>
                {" "}— {result.alternative_note}
              </p>
            )}
          </div>
          <ConfidenceRing pct={result.confidence_pct} />
        </div>
      </div>

      {/* AI Explanation */}
      <div className="p-5 rounded-2xl bg-white/02 border border-white/06 flex gap-3">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-white/55 leading-relaxed">
          <span className="font-semibold text-indigo-300">AI Explanation: </span>
          {result.ai_explanation}
        </p>
      </div>

      {/* Dimension scores */}
      {result.dimension_scores.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/06 space-y-4">
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Dimension Match</p>
          {result.dimension_scores.map((d, i) => (
            <motion.div
              key={d.dimension}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-white/40 w-20 flex-shrink-0">{d.dimension}</span>
              <div className="flex-1 h-2 bg-white/05 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${d.match_pct}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="text-xs font-mono text-white/40 w-10 text-right flex-shrink-0">
                {d.match_pct.toFixed(0)}%
              </span>
              <span className={`text-[10px] font-semibold w-24 text-right flex-shrink-0 ${noteColor(d.note)}`}>
                {d.note}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product badge */}
      {garmentName && (
        <p className="text-xs text-white/25 text-center">
          Based on size chart for <span className="text-white/50 font-semibold">{garmentName}</span>
        </p>
      )}
    </motion.div>
  );
}

// ─── Demo size chart (fallback when no chart is stored) ──────────────────────

const DEMO_CHART: StoredChart = {
  chart_id: "demo",
  garment_name: "Classic Relaxed T-Shirt (Demo)",
  garment_type: "T-Shirt",
  fit_style: "Relaxed",
  fabric_type: "Cotton",
  sizes: [
    { size: "XS", chest_cm: 48, shoulder_cm: 42, length_cm: 66, waist_cm: 46, hip_cm: 48 },
    { size: "S",  chest_cm: 52, shoulder_cm: 44, length_cm: 68, waist_cm: 50, hip_cm: 52 },
    { size: "M",  chest_cm: 56, shoulder_cm: 46, length_cm: 70, waist_cm: 54, hip_cm: 56 },
    { size: "L",  chest_cm: 60, shoulder_cm: 48, length_cm: 72, waist_cm: 58, hip_cm: 60 },
    { size: "XL", chest_cm: 64, shoulder_cm: 50, length_cm: 74, waist_cm: 62, hip_cm: 64 },
    { size: "2XL",chest_cm: 68, shoulder_cm: 52, length_cm: 76, waist_cm: 66, hip_cm: 68 },
  ],
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecommendPage() {
  const searchParams = useSearchParams();

  const [chart, setChart]       = useState<StoredChart>(DEMO_CHART);
  const [height, setHeight]     = useState("178");
  const [weight, setWeight]     = useState("74");
  const [chest, setChest]       = useState("98");
  const [waist, setWaist]       = useState("82");
  const [hip, setHip]           = useState("");
  const [shoulder, setShoulder] = useState("");

  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<RecommendResult | null>(null);
  const [error, setError]       = useState("");

  // Load stored chart from localStorage (set by /seller/upload)
  useEffect(() => {
    const stored = localStorage.getItem("fitgenius_chart");
    if (stored) {
      try {
        setChart(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  const validate = () => {
    if (!height || !weight || !chest || !waist) return "Please fill in all required fields.";
    if (Number(chest) < 50 || Number(chest) > 180) return "Chest must be between 50–180 cm.";
    if (Number(waist) < 40 || Number(waist) > 180) return "Waist must be between 40–180 cm.";
    if (Number(height) < 100 || Number(height) > 250) return "Height must be between 100–250 cm.";
    if (Number(weight) < 30 || Number(weight) > 300) return "Weight must be between 30–300 kg.";
    return null;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const body = {
        body: {
          height_cm:   Number(height),
          weight_kg:   Number(weight),
          chest_cm:    Number(chest),
          waist_cm:    Number(waist),
          hip_cm:      hip ? Number(hip) : null,
          shoulder_cm: shoulder ? Number(shoulder) : null,
        },
        sizes:         chart.sizes,
        garment_type:  chart.garment_type,
        fit_style:     chart.fit_style,
        garment_name:  chart.garment_name,
      };

      const res = await fetch("/api/v1/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(e.detail ?? "Failed to get recommendation.");
      }

      const data: RecommendResult = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, weight, chest, waist, hip, shoulder, chart]);

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-violet w-[500px] h-[500px] -top-32 right-0 opacity-20" />
        <div className="orb orb-indigo w-[400px] h-[400px] bottom-0 -left-24 opacity-15" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      <main className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">

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
              <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-xs font-bold text-violet-400 uppercase tracking-widest glass border border-violet-500/20 rounded-full px-3 py-1">
                Size Recommender
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Find Your{" "}
              <span className="text-gradient">Perfect Size</span>
            </h1>
            <p className="text-white/40 mt-3 text-lg leading-relaxed">
              Enter your measurements and our AI will match you to the best size with a confidence score and explanation.
            </p>
          </motion.div>

          {/* Garment context badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 flex items-center gap-3 glass rounded-2xl p-4 border border-white/06 w-fit"
          >
            <Ruler className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-white/30 font-medium">Sizing chart for:</p>
              <p className="text-sm font-bold text-white">{chart.garment_name}</p>
            </div>
            <div className="ml-2 flex gap-1.5 flex-wrap">
              {[chart.garment_type, chart.fit_style].map((t) => (
                <span key={t} className="text-[10px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/15 rounded-full px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
            {chart.chart_id === "demo" && (
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/15 rounded-full px-2 py-0.5">
                Demo
              </span>
            )}
          </motion.div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Left: Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="glass-strong rounded-3xl p-8 border border-white/08 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-violet-400" />
                  Your Measurements
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <MeasurementInput label="Height *" value={height} onChange={setHeight} unit="cm" min={100} max={250} placeholder="178" />
                    <MeasurementInput label="Weight *" value={weight} onChange={setWeight} unit="kg" min={30} max={300} placeholder="74" />
                    <MeasurementInput label="Chest *" value={chest} onChange={setChest} unit="cm" min={50} max={180} placeholder="98" />
                    <MeasurementInput label="Waist *" value={waist} onChange={setWaist} unit="cm" min={40} max={180} placeholder="82" />
                    <MeasurementInput label="Hip" value={hip} onChange={setHip} unit="cm" min={50} max={200} placeholder="optional" />
                    <MeasurementInput label="Shoulder" value={shoulder} onChange={setShoulder} unit="cm" min={30} max={70} placeholder="optional" />
                  </div>

                  <p className="text-[11px] text-white/25 mt-2">
                    * Required. Hip and shoulder improve accuracy.
                  </p>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/08 border border-red-500/20"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="btn-primary flex-1 py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full relative z-10"
                          />
                          <span>Finding your size…</span>
                        </>
                      ) : (
                        <>
                          <Scale className="w-5 h-5 relative z-10" />
                          <span>Get Recommendation</span>
                          <ArrowRight className="w-4 h-4 relative z-10" />
                        </>
                      )}
                    </motion.button>
                    {result && (
                      <button
                        type="button"
                        onClick={() => setResult(null)}
                        className="btn-ghost py-4 px-4"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Upload prompt */}
              {chart.chart_id === "demo" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-4 rounded-2xl bg-amber-500/06 border border-amber-500/15 flex items-center gap-3"
                >
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-300/80">
                      Using demo chart.{" "}
                      <Link href="/seller/upload" className="font-bold underline hover:text-amber-200">
                        Upload a real garment
                      </Link>{" "}
                      to get measurements for your specific product.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right: Result */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:sticky lg:top-24 self-start"
            >
              <AnimatePresence mode="wait">
                {result ? (
                  <ResultCard key="result" result={result} garmentName={chart.garment_name} />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-strong rounded-3xl p-10 border border-white/08 flex flex-col items-center justify-center text-center gap-6 min-h-[420px]"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 rounded-full border border-dashed border-white/10"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Scale className="w-8 h-8 text-white/20" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white/50 font-semibold mb-2">Waiting for measurements</p>
                      <p className="text-sm text-white/25 leading-relaxed max-w-xs">
                        Fill in your body measurements and hit "Get Recommendation" to see your perfect size with AI analysis.
                      </p>
                    </div>

                    {/* Size preview */}
                    <div className="flex gap-2">
                      {chart.sizes.map((s) => (
                        <div key={s.size} className="w-10 h-10 rounded-xl glass border border-white/06 flex items-center justify-center text-xs font-bold text-white/25">
                          {s.size}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-white/20 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40" />
                      <span>AI-powered · Instant result · Confidence scored</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
