"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail, User, ShieldCheck, Shirt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ToastContainer, ToastMessage } from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "seller">("customer");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, description?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Registration failed");
      }

      const data = await res.json();
      login(data.token, data.user);
      addToast("success", "Account Created!", `Welcome to FitGenius, ${name}`);
      setTimeout(() => {
        router.push(role === "seller" ? "/seller/products" : "/shop");
      }, 1000);
    } catch (err: any) {
      addToast("error", "Registration Failed", err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white flex items-center justify-center p-4">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div className="w-full max-w-md glass-strong rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Create Account</h1>
          <p className="text-xs text-white/50">Join FitGenius AI Fashion Platform</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === "customer"
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                    : "glass text-white/60 hover:text-white"
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole("seller")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === "seller"
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                    : "glass text-white/60 hover:text-white"
                }`}
              >
                Seller Studio
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                required
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/05 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                placeholder="alex@fitgenius.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/05 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/05 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-purple w-full py-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {loading ? "Creating Account..." : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-white/40 pt-2 border-t border-white/08">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-purple-400 font-bold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
