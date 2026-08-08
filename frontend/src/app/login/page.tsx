"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Sparkles, Eye, EyeOff, ArrowRight, Mail, Lock,
  CheckCircle2, Shield, Zap, ChevronRight,
  TrendingDown, Clock, Star, X,
} from "lucide-react";

// Inline GitHub icon (lucide-react v1.30 dropped the Github export)
const GithubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);
import { FadeUp, FadeIn, ScaleIn, StaggerContainer, StaggerItem, EASE_OUT_EXPO } from "@/components/motion";

/* --- Particle System ------------------------------------------ */
function Particle({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-indigo-500 pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, opacity: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        y: [0, -80, -160],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

/* --- Magnetic Button ------------------------------------------- */
function MagneticButton({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25 });
  const springY = useSpring(y, { stiffness: 300, damping: 25 });

  const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.2);
    y.set((e.clientY - cy) * 0.2);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      style={{ x: springX, y: springY, ...style }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* --- Floating Input -------------------------------------------- */
function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
  error,
  rightElement,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  error?: string;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative">
      <motion.div
        animate={{
          borderColor: error
            ? "rgba(239,68,68,0.5)"
            : focused
            ? "rgba(99,102,241,0.5)"
            : "rgba(255,255,255,0.08)",
          boxShadow: error
            ? "0 0 0 3px rgba(239,68,68,0.08)"
            : focused
            ? "0 0 0 3px rgba(99,102,241,0.08)"
            : "none",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl border bg-white/03 overflow-hidden group"
        style={{ borderWidth: 1 }}
      >
        {/* Left icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Icon
            className={`w-4 h-4 transition-colors duration-200 ${focused ? "text-indigo-400" : "text-white/25"}`}
          />
        </div>

        {/* Floating label */}
        <motion.label
          htmlFor={id}
          animate={{
            top: lifted ? "10px" : "50%",
            y: lifted ? "0%" : "-50%",
            fontSize: lifted ? "10px" : "14px",
            color: lifted
              ? focused
                ? "rgba(165,180,252,1)"
                : "rgba(255,255,255,0.35)"
              : "rgba(255,255,255,0.35)",
          }}
          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          className="absolute left-11 font-semibold uppercase tracking-wider pointer-events-none z-10 origin-left"
        >
          {label}
        </motion.label>

        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-white text-sm font-medium px-11 pt-7 pb-3 pr-12 outline-none placeholder-transparent"
        />

        {/* Right element (e.g., eye toggle) */}
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            {rightElement}
          </div>
        )}

        {/* Focus shimmer */}
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 origin-left"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-xs text-red-400 font-medium flex items-center gap-1.5 pl-2"
          >
            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --- Social Auth Button ---------------------------------------- */
function SocialButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.07)" }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-white/04 border border-white/08 text-sm font-semibold text-white/70 transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </motion.button>
  );
}

/* --- Floating Feature Chip ------------------------------------- */
function FeatureChip({
  icon: Icon,
  text,
  style,
  animate,
}: {
  icon: React.ElementType;
  text: string;
  style: React.CSSProperties;
  animate: any;
}) {
  return (
    <motion.div
      className="absolute glass-strong rounded-2xl px-4 py-3 flex items-center gap-2.5 border border-white/08 shadow-xl"
      style={style}
      animate={animate}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <Icon className="w-4 h-4 text-indigo-400" />
      <span className="text-xs font-semibold text-white/70">{text}</span>
    </motion.div>
  );
}

/* --- Main Login Page ------------------------------------------- */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string; name?: string }>({});

  /* Forgot Password Modal state */
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail]         = useState("");
  const [forgotSent, setForgotSent]           = useState(false);

  /* Cursor parallax for the decorative panel */
  const cursorX = useMotionValue(0.5);
  const cursorY = useMotionValue(0.5);
  const panelRotateX = useSpring(useTransform(cursorY, [0, 1], [6, -6]), { stiffness: 80, damping: 20 });
  const panelRotateY = useSpring(useTransform(cursorX, [0, 1], [-8, 8]), { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX / window.innerWidth);
      cursorY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [cursorX, cursorY]);

  /* Particles config */
  const particles = Array.from({ length: 12 }, (_, i) => ({
    x: `${(i * 8.3) % 100}%`,
    y: `${60 + (i * 7) % 40}%`,
    size: 2 + (i % 3),
    delay: i * 0.4,
  }));

  /* Form validation */
  function validate() {
    const e: typeof errors = {};
    if (!email.includes("@")) e.email = "Please enter a valid email address.";
    if (password.length < 8)  e.password = "Password must be at least 8 characters.";
    if (mode === "signup" && name.trim().length < 2) e.name = "Please enter your full name.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* Core login submission helper */
  async function performLogin(targetEmail: string, targetPass: string, targetName?: string) {
    setLoading(true);
    setErrors({});

    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const body =
        mode === "login"
          ? { email: targetEmail, password: targetPass }
          : { name: targetName || name, email: targetEmail, password: targetPass };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ email: data.detail ?? "Invalid credentials. Please try again." });
        setLoading(false);
        return;
      }

      // Persist auth info
      localStorage.setItem("fitgenius_token", data.access_token);
      localStorage.setItem("fitgenius_user", JSON.stringify(data.user));

      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/seller/upload"), 1400);
    } catch {
      setErrors({ email: "Could not reach authentication server. Please check backend connection." });
      setLoading(false);
    }
  }

  /* Submit handler */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await performLogin(email, password, name);
  }

  /* Quick Demo fill & login */
  async function handleQuickDemo(demoEmail: string, demoName: string) {
    setMode("login");
    setEmail(demoEmail);
    setPassword("password123");
    await performLogin(demoEmail, "password123", demoName);
  }

  /* Social OAuth login handler */
  async function handleSocialLogin(provider: "github" | "google") {
    setSocialLoading(provider);
    setErrors({});
    try {
      const res = await fetch("/api/v1/auth/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          email: `${provider}.user@fitgenius.ai`,
          name: provider === "github" ? "GitHub Developer" : "Google User",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Social authentication failed");

      localStorage.setItem("fitgenius_token", data.access_token);
      localStorage.setItem("fitgenius_user", JSON.stringify(data.user));

      setSocialLoading(null);
      setSuccess(true);
      setTimeout(() => router.push("/seller/upload"), 1400);
    } catch {
      setErrors({ email: `Failed to authenticate with ${provider}. Please try standard login.` });
      setSocialLoading(null);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-black flex overflow-hidden">
      {/* Particle Layer */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* --- Left Panel – Decorative --------------------------- */}
      <motion.div
        className="hidden lg:flex flex-col justify-between relative w-[55%] bg-neutral-950 overflow-hidden p-14"
        style={{ rotateX: panelRotateX, rotateY: panelRotateY, perspective: 1200 }}
      >
        {/* Background mesh */}
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />

        {/* Orbs */}
        <motion.div
          className="orb orb-indigo w-[500px] h-[500px] -top-20 -left-20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="orb orb-violet w-[400px] h-[400px] bottom-0 right-0"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="orb orb-pink w-[250px] h-[250px] top-1/2 left-1/2"
          animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />

        {/* Logo */}
        <FadeIn className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/30"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">FitGenius AI</span>
              <p className="text-[10px] text-white/30 font-medium tracking-widest uppercase">Enterprise Platform</p>
            </div>
          </Link>
        </FadeIn>

        {/* Main visual */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <FadeUp delay={2}>
            <h2 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
              AI That Finds
              <br />
              <span className="text-gradient">Your Perfect Fit</span>
            </h2>
            <p className="text-white/40 text-lg leading-relaxed max-w-md">
              Upload a garment. Get a complete, AI-generated size chart.
              Give shoppers the right size — every time.
            </p>
          </FadeUp>

          {/* Mini dashboard mockup */}
          <ScaleIn delay={4} className="mt-10">
            <div className="glass-strong rounded-3xl p-6 border border-white/08 shadow-2xl shadow-indigo-500/05 max-w-md">
              {/* Size recommendation widget */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Fit Recommendation</p>
                    <p className="text-[10px] text-white/30">Processed in 2.8s</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  97% Match
                </span>
              </div>

              {/* Size grid */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {(["S", "M", "L", "XL"] as const).map((sz) => (
                  <motion.div
                    key={sz}
                    whileHover={{ scale: 1.05 }}
                    className={`rounded-xl py-3 text-center font-bold text-sm cursor-default transition-all ${sz === "L" ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300" : "bg-white/03 border border-white/05 text-white/30"}`}
                  >
                    {sz}
                    {sz === "L" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400 mx-auto mt-1"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Metrics */}
              {[
                { label: "Chest Match",    value: 97 },
                { label: "Shoulder Fit",   value: 94 },
                { label: "Length Perfect", value: 99 },
              ].map((m, i) => (
                <div key={m.label} className="flex items-center gap-3 mb-2.5 last:mb-0">
                  <span className="text-[11px] text-white/35 w-24">{m.label}</span>
                  <div className="flex-1 h-1 bg-white/04 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.value}%` }}
                      transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease: EASE_OUT_EXPO }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
                    />
                  </div>
                  <span className="text-[11px] text-white/40 font-mono w-8 text-right">{m.value}%</span>
                </div>
              ))}
            </div>
          </ScaleIn>

          {/* Floating chips */}
          <FeatureChip
            icon={TrendingDown}
            text="Returns ↓ 30%"
            style={{ top: "12%", right: "5%" }}
            animate={{ y: [0, -12, 0] }}
          />
          <FeatureChip
            icon={Clock}
            text="3s chart gen"
            style={{ bottom: "25%", right: "8%" }}
            animate={{ y: [0, 10, 0] }}
          />
          <FeatureChip
            icon={Star}
            text="98% accuracy"
            style={{ top: "45%", right: "2%" }}
            animate={{ y: [0, -8, 0] }}
          />
        </div>

        {/* Testimonial strip */}
        <FadeIn delay={6} className="relative z-10">
          <div className="flex items-center gap-4 glass rounded-2xl p-4 border border-white/06 max-w-sm">
            <div className="flex -space-x-2">
              {["#6366f1","#8b5cf6","#ec4899","#22d3ee"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-neutral-950 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c }}>
                  {["S","M","L","A"][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                {Array.from({length: 5}).map((_,i) => (
                  <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-white/50 leading-tight">
                <span className="font-semibold text-white/80">2,400+ sellers</span> trust FitGenius AI
              </p>
            </div>
          </div>
        </FadeIn>
      </motion.div>

      {/* --- Right Panel – Auth Form ---------------------------- */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Background for mobile */}
        <div className="absolute inset-0 lg:hidden">
          <div className="orb orb-indigo w-[300px] h-[300px] top-0 left-1/2 -translate-x-1/2 opacity-20" />
          <div className="absolute inset-0 grid-pattern opacity-40" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">

          {/* Mobile logo */}
          <FadeIn className="lg:hidden mb-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">FitGenius AI</span>
          </FadeIn>

          {/* Mode toggle tabs */}
          <FadeUp delay={1} className="mb-8">
            <div className="flex glass rounded-2xl p-1 border border-white/06">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErrors({}); setSuccess(false); }}
                  className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                >
                  <AnimatePresence>
                    {mode === m && (
                      <motion.div
                        layoutId="tab-bg"
                        className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/25"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                  </AnimatePresence>
                  <span className={`relative z-10 transition-colors ${mode === m ? "text-white" : "text-white/40"}`}>
                    {m === "login" ? "Sign In" : "Create Account"}
                  </span>
                </button>
              ))}
            </div>
          </FadeUp>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="mb-6"
            >
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-white/40 text-sm">
                {isLogin
                  ? "Sign in to access your seller dashboard and AI tools."
                  : "Join 2,400+ sellers using AI-powered fit charts."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Quick Demo Login Bar */}
          {isLogin && !success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  Instant 1-Click Demo Login
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("demo@fitgenius.ai", "Demo Seller")}
                  className="py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  <span>Seller Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("customer@fitgenius.ai", "Sarah Chen")}
                  className="py-2 px-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Shield className="w-3 h-3 text-violet-300" />
                  <span>Customer Demo</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="mb-6 p-5 rounded-2xl bg-emerald-500/08 border border-emerald-500/20 flex items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                  className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {isLogin ? "Welcome back!" : "Account created!"}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {isLogin ? "Redirecting to your dashboard..." : "Verifying your email address..."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            {!success && (
              <motion.form
                key={mode + "-form"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
              >
                <StaggerContainer className="space-y-4 mb-6">
                  {/* Name field – signup only */}
                  <AnimatePresence>
                    {!isLogin && (
                      <StaggerItem>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                          className="overflow-hidden"
                        >
                          <FloatingInput
                            id="name"
                            label="Full Name"
                            value={name}
                            onChange={setName}
                            icon={Sparkles}
                            error={errors.name}
                          />
                        </motion.div>
                      </StaggerItem>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <StaggerItem>
                    <FloatingInput
                      id="email"
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      icon={Mail}
                      error={errors.email}
                    />
                  </StaggerItem>

                  {/* Password */}
                  <StaggerItem>
                    <FloatingInput
                      id="password"
                      label="Password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      icon={Lock}
                      error={errors.password}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="text-white/25 hover:text-white/60 transition-colors"
                        >
                          {showPass
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye    className="w-4 h-4" />}
                        </button>
                      }
                    />
                  </StaggerItem>
                </StaggerContainer>

                {/* Forgot password – login only */}
                <AnimatePresence>
                  {isLogin && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-end mb-6"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email || "");
                          setForgotSent(false);
                          setShowForgotModal(true);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                      >
                        Forgot password?
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Terms – signup only */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-white/30 mb-6 leading-relaxed"
                    >
                      By creating an account you agree to our{" "}
                      <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <MagneticButton
                  type="submit"
                  disabled={loading || !!socialLoading}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white relative overflow-hidden flex items-center justify-center gap-3"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 0 40px rgba(99,102,241,0.3), 0 4px 20px rgba(99,102,241,0.2)",
                  } as React.CSSProperties}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                  />

                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2.5 relative z-10"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>Authenticating…</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="label"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 relative z-10"
                      >
                        <span>{isLogin ? "Sign In to Dashboard" : "Create Free Account"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </MagneticButton>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/06" />
                  <span className="text-xs text-white/25 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-white/06" />
                </div>

                {/* Social auth */}
                <div className="grid grid-cols-2 gap-3">
                  <SocialButton
                    icon={GithubIcon}
                    label={socialLoading === "github" ? "Connecting…" : "GitHub"}
                    onClick={() => handleSocialLogin("github")}
                  />
                  <SocialButton
                    icon={() => (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    label={socialLoading === "google" ? "Connecting…" : "Google"}
                    onClick={() => handleSocialLogin("google")}
                  />
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Mode switch link */}
          <FadeIn delay={8} className="mt-8 text-center">
            <p className="text-sm text-white/30">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setMode(isLogin ? "signup" : "login"); setErrors({}); setSuccess(false); }}
                className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
              >
                {isLogin ? "Create one free" : "Sign in"}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </p>
          </FadeIn>

          {/* Trust badges */}
          <FadeIn delay={10} className="mt-8">
            <div className="flex items-center justify-center gap-6 text-[11px] text-white/20 font-medium">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500/50" />
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500/50" />
                256-bit Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-500/50" />
                DPDP Ready
              </span>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-white/40">Enter your email to receive recovery instructions</p>
                </div>
              </div>

              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center my-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">Reset Link Sent!</p>
                  <p className="text-xs text-white/50 mt-1">
                    We sent password reset instructions to <span className="text-emerald-300">{forgotEmail}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (forgotEmail.includes("@")) {
                      setForgotSent(true);
                    }
                  }}
                  className="space-y-4 my-4"
                >
                  <FloatingInput
                    id="forgot-email"
                    label="Account Email"
                    type="email"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    icon={Mail}
                  />

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      Send Reset Instructions
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
