"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Heart, ShoppingCart, ArrowRight, Eye, Sparkles, Shirt } from "lucide-react";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { motion } from "framer-motion";

export interface ProductCardProps {
  product: {
    id: string;
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
  };
  onToast?: (type: "success" | "error" | "info", title: string, desc?: string) => void;
}

export function ProductCard({ product, onToast }: ProductCardProps) {
  const router = useRouter();
  const { wishlistedIds, toggleWishlist, addToCart } = useCartWishlist();
  const [selectedSize, setSelectedSize] = useState<string>(
    product.recommendedSize || (product.sizes && product.sizes[0]) || "M"
  );
  const [addingCart, setAddingCart] = useState(false);

  const isWishlisted = wishlistedIds.has(product.id);
  const displayPrice = product.discountPrice || product.price;
  const mrp = product.price > displayPrice ? product.price : Math.round(displayPrice * 1.35);
  const discountPct = Math.round(((mrp - displayPrice) / mrp) * 100);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = await toggleWishlist(product.id);
    if (onToast) {
      onToast("success", added ? "Added to Wishlist ♡" : "Removed from Wishlist", `"${product.name}"`);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingCart(true);
    const ok = await addToCart(product.id, selectedSize, 1);
    setAddingCart(false);
    if (ok && onToast) {
      onToast("success", "Added to Cart 🛒", `Size ${selectedSize} • "${product.name}"`);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingCart(true);
    await addToCart(product.id, selectedSize, 1);
    setAddingCart(false);
    router.push("/checkout");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-strong rounded-3xl p-4 border border-white/08 hover:border-purple-500/40 transition-all duration-300 group flex flex-col justify-between"
    >
      <div>
        {/* Image Container */}
        <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-4 bg-zinc-900/80">
          <Link href={`/products/${product.id}`}>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
              {product.category}
            </span>
            {discountPct > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-[10px] font-black text-white">
                {discountPct}% OFF
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 transition-all z-10"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-white/80 hover:text-rose-400"}`} />
          </button>

          {/* Rating Pill */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-300 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
            <span className="text-white/40 text-[10px]">({product.reviewCount || 12})</span>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-2 mb-4">
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Fit & Fabric */}
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <span className="flex items-center gap-1">
              <Shirt className="w-3 h-3 text-purple-400" />
              {product.fit}
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-extrabold text-white">₹{displayPrice.toLocaleString()}</span>
            {mrp > displayPrice && (
              <span className="text-xs text-white/40 line-through font-mono">₹{mrp.toLocaleString()}</span>
            )}
          </div>

          {/* Size Selector Pills */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[10px] text-white/40 uppercase font-bold mb-1">
              <span>Select Size:</span>
              {product.recommendedSize && (
                <span className="text-purple-400 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" />
                  Rec: {product.recommendedSize}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(product.sizes || ["XS", "S", "M", "L", "XL", "2XL"]).map((sz) => {
                const isSelected = selectedSize === sz;
                const isRec = product.recommendedSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isSelected
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/40 ring-1 ring-purple-400"
                        : isRec
                        ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                        : "bg-white/05 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/08">
        <button
          onClick={handleAddToCart}
          disabled={addingCart}
          className="py-2 px-3 rounded-xl bg-white/05 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
          <span>Add to Cart</span>
        </button>

        <button
          onClick={handleBuyNow}
          disabled={addingCart}
          className="btn-purple py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-purple-500/20"
        >
          <span>Buy Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
