"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles, ShoppingBag, Heart, ShoppingCart, Package,
  User, LayoutDashboard, Upload, LogOut, ChevronDown,
  Scale, Tag, Sparkle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartWishlist } from "@/contexts/CartWishlistContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const { cartCount, wishlistCount } = useCartWishlist();
  const [profileOpen, setProfileOpen] = useState(false);

  const isSeller = user?.role === "seller";

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-strong border-b border-white/08">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none tracking-tight">FitGenius AI</span>
            <span className="text-[9px] text-purple-400 font-semibold uppercase tracking-wider">Fashion Store</span>
          </div>
        </Link>

        {/* Main Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/03 p-1 rounded-2xl border border-white/05">
          <Link
            href="/shop"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === "/shop" ? "bg-purple-500 text-white shadow-md shadow-purple-500/30" : "text-white/70 hover:text-white hover:bg-white/05"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop</span>
          </Link>

          <Link
            href="/recommend"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === "/recommend" ? "bg-purple-500 text-white shadow-md shadow-purple-500/30" : "text-white/70 hover:text-white hover:bg-white/05"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-pink-400" />
            <span>Find My Size</span>
          </Link>

          <Link
            href="/orders"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === "/orders" ? "bg-purple-500 text-white shadow-md shadow-purple-500/30" : "text-white/70 hover:text-white hover:bg-white/05"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Orders</span>
          </Link>

          {isSeller && (
            <Link
              href="/seller/products"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pathname.startsWith("/seller") ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30" : "text-indigo-300 hover:text-white hover:bg-white/05"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Seller Studio</span>
            </Link>
          )}
        </nav>

        {/* Right Action Icons & Badges */}
        <div className="flex items-center gap-2">
          {/* Wishlist Link with Badge */}
          <Link
            href="/wishlist"
            className="relative p-2.5 rounded-xl glass border border-white/08 hover:border-purple-500/50 hover:bg-purple-500/10 text-white/80 hover:text-purple-300 transition-colors"
            title="Wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-rose-500/50 animate-pulse">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Link with Badge */}
          <Link
            href="/cart"
            className="relative p-2.5 rounded-xl glass border border-white/08 hover:border-purple-500/50 hover:bg-purple-500/10 text-white/80 hover:text-purple-300 transition-colors"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl glass border border-white/08 hover:border-white/20 transition-all text-xs font-semibold"
            >
              <img
                src={user?.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Customer"}
                alt={user?.name || "User"}
                className="w-7 h-7 rounded-lg object-cover border border-white/10"
              />
              <span className="hidden sm:inline-block text-white/90 truncate max-w-[100px]">
                {user?.name || "Guest"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl p-2 border border-white/10 shadow-2xl space-y-1 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-white/08">
                  <p className="text-xs font-bold text-white">{user?.name}</p>
                  <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-bold uppercase">
                    Role: {user?.role}
                  </span>
                </div>

                {/* Role Switcher */}
                <button
                  onClick={() => {
                    switchRole(isSeller ? "customer" : "seller");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-purple-300 hover:bg-purple-500/10 rounded-xl flex items-center justify-between transition-colors"
                >
                  <span>Switch to {isSeller ? "Customer View" : "Seller Studio"}</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                {isSeller && (
                  <>
                    <Link
                      href="/seller/products"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/05 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Seller Dashboard</span>
                    </Link>
                    <Link
                      href="/seller/upload"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/05 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-pink-400" />
                      <span>Upload New Garment</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/orders"
                  onClick={() => setProfileOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/05 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span>My Orders</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-colors border-t border-white/08 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
