"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles, Star, Eye, Heart, Share2, Download, Scale,
  Calendar, User, Shirt, Tag, CheckCircle2, MessageSquare,
  Send, ArrowLeft, Ruler, Info, ShoppingCart, ArrowRight, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { useCartWishlist } from "@/contexts/CartWishlistContext";

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
  price: number;
  discountPrice?: number;
  description?: string;
  brand?: string;
  tags: string[];
  sizeChart: SizeEntry[];
  aiInsight: string;
  rating: number;
  reviewCount: number;
  views: number;
  favorites: number;
  createdAt: string;
}

interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const { wishlistedIds, toggleWishlist, addToCart } = useCartWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
    reviews: Review[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [addingCart, setAddingCart] = useState(false);

  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const resProd = await fetch(`/api/v1/products/${productId}`);
      if (!resProd.ok) throw new Error("Product not found");
      const prodData = await resProd.json();
      setProduct(prodData);
      if (prodData.sizeChart && prodData.sizeChart.length > 0) {
        setSelectedSize(prodData.sizeChart[0].size);
      }

      const resRev = await fetch(`/api/v1/products/${productId}/reviews`);
      if (resRev.ok) {
        const revData = await resRev.json();
        setReviewsData(revData);
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Error loading product", "Product does not exist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) loadData();
  }, [productId]);

  const isWishlisted = product ? wishlistedIds.has(product.id) : false;

  const handleWishlist = async () => {
    if (!product) return;
    const added = await toggleWishlist(product.id);
    addToast("success", added ? "Added to Wishlist ♡" : "Removed from Wishlist", `"${product.name}"`);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingCart(true);
    const ok = await addToCart(product.id, selectedSize, 1);
    setAddingCart(false);
    if (ok) {
      addToast("success", "Added to Cart 🛒", `Size ${selectedSize} • "${product.name}"`);
    } else {
      addToast("error", "Failed to add to cart", "Try again.");
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setAddingCart(true);
    await addToCart(product.id, selectedSize, 1);
    setAddingCart(false);
    router.push("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/v1/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: newUsername.trim() || "Verified Buyer",
          rating: newRating,
          comment: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      addToast("success", "Review Submitted!", "Thank you for your feedback.");
      setNewComment("");

      // Reload reviews & product average rating
      const resRev = await fetch(`/api/v1/products/${productId}/reviews`);
      if (resRev.ok) {
        const revData = await resRev.json();
        setReviewsData(revData);
      }
      const resProd = await fetch(`/api/v1/products/${productId}`);
      if (resProd.ok) {
        const prodData = await resProd.json();
        setProduct(prodData);
      }
    } catch (e) {
      console.error(e);
      addToast("error", "Review Submission Failed", "Could not save review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-12 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white p-12 text-center">
        <h2 className="text-xl font-bold mb-4">Product Not Found</h2>
        <Link href="/shop" className="btn-purple py-2 px-4 text-xs font-bold rounded-xl">
          Return to Shop
        </Link>
      </div>
    );
  }

  const displayPrice = product.discountPrice || product.price;
  const mrp = product.price > displayPrice ? product.price : Math.round(displayPrice * 1.35);
  const discountPct = Math.round(((mrp - displayPrice) / mrp) * 100);
  const availableSizes = product.sizeChart ? product.sizeChart.map(s => s.size) : ["XS", "S", "M", "L", "XL", "2XL"];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-20 space-y-12">
        {/* Back Link */}
        <Link href="/shop" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shop Catalogue</span>
        </Link>

        {/* Product Main Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Product Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative w-full h-[460px] md:h-[540px] rounded-3xl overflow-hidden glass border border-white/10 group">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  {product.category}
                </span>
                {discountPct > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs shadow-lg">
                    {discountPct}% OFF
                  </span>
                )}
              </div>

              <button
                onClick={handleWishlist}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 transition-all"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-white"}`} />
              </button>
            </div>
          </div>

          {/* Right Column: Product Metadata, Pricing, Size Selector & Checkout CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-1">
                <span>Seller: <strong className="text-white">{product.sellerName}</strong></span>
                <span className="text-white/40">{product.brand || "FitGenius Studio"}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-white/50 font-semibold">
                  {reviewsData?.totalReviews || product.reviewCount || 128} Reviews
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/50 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  {product.views} Views
                </span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="glass-strong rounded-2xl p-5 border border-white/10 flex items-baseline gap-4">
              <span className="text-3xl font-black text-white">₹{displayPrice.toLocaleString()}</span>
              {mrp > displayPrice && (
                <>
                  <span className="text-base text-white/40 line-through font-mono">₹{mrp.toLocaleString()}</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Save ₹{(mrp - displayPrice).toLocaleString()} ({discountPct}% OFF)
                  </span>
                </>
              )}
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white/60">Available Sizes:</span>
                <Link
                  href={`/recommend?product_id=${product.id}`}
                  className="text-purple-400 hover:underline flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Find My Perfect Size</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {availableSizes.map((sz) => {
                  const isSel = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        isSel
                          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400"
                          : "glass text-white/70 hover:text-white border border-white/10"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Call to Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={addingCart}
                className="py-4 px-6 rounded-2xl bg-white/05 hover:bg-purple-500/20 border border-white/15 hover:border-purple-500/40 text-sm font-extrabold text-white transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4 text-purple-400" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={addingCart}
                className="btn-purple py-4 px-6 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* AI Insight Box */}
            {product.aiInsight && (
              <div className="glass p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20 text-xs text-white/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Gemini Vision AI Analysis</span>
                </div>
                <p className="leading-relaxed">{product.aiInsight}</p>
              </div>
            )}
          </div>
        </div>

        {/* Gemini Vision Generated Size Chart Matrix */}
        {product.sizeChart && product.sizeChart.length > 0 && (
          <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Ruler className="w-5 h-5 text-purple-400" />
                <span>Garment Size Chart Specs (in {unit})</span>
              </h3>
              <div className="flex items-center gap-1 glass p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setUnit("cm")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${unit === "cm" ? "bg-purple-500 text-white" : "text-white/40"}`}
                >
                  CM
                </button>
                <button
                  onClick={() => setUnit("in")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${unit === "in" ? "bg-purple-500 text-white" : "text-white/40"}`}
                >
                  INCH
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase">
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Chest</th>
                    <th className="py-3 px-4">Shoulder</th>
                    <th className="py-3 px-4">Length</th>
                    <th className="py-3 px-4">Waist</th>
                    <th className="py-3 px-4">Hip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/05 font-medium">
                  {product.sizeChart.map((s, idx) => {
                    const factor = unit === "in" ? 0.393701 : 1;
                    const fmt = (val: number) => (val * factor).toFixed(unit === "in" ? 1 : 0);
                    const isSel = selectedSize === s.size;
                    return (
                      <tr key={idx} className={isSel ? "bg-purple-500/20 font-bold" : "hover:bg-white/05"}>
                        <td className="py-3 px-4 text-purple-300 font-extrabold">{s.size}</td>
                        <td className="py-3 px-4 text-white/80">{fmt(s.chest_cm)} {unit}</td>
                        <td className="py-3 px-4 text-white/80">{fmt(s.shoulder_cm)} {unit}</td>
                        <td className="py-3 px-4 text-white/80">{fmt(s.length_cm)} {unit}</td>
                        <td className="py-3 px-4 text-white/80">{fmt(s.waist_cm)} {unit}</td>
                        <td className="py-3 px-4 text-white/80">{fmt(s.hip_cm)} {unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span>Customer Ratings & Reviews ({reviewsData?.totalReviews || 0})</span>
          </h3>

          {/* Review Form */}
          <form onSubmit={handleSubmitReview} className="glass p-4 rounded-2xl border border-white/08 space-y-4">
            <h4 className="text-xs font-bold text-white">Write a Review</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="p-1 text-amber-400"
                >
                  <Star className={`w-4 h-4 ${star <= newRating ? "fill-amber-400" : "text-white/20"}`} />
                </button>
              ))}
            </div>

            <textarea
              required
              rows={2}
              placeholder="Write your honest thoughts about the fit, fabric, and sizing accuracy..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-white/05 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
            />

            <button type="submit" disabled={submittingReview} className="btn-purple py-2 px-4 text-xs font-bold rounded-xl inline-flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              <span>Submit Review</span>
            </button>
          </form>

          {/* Review List */}
          <div className="space-y-4">
            {reviewsData?.reviews.map((r) => (
              <div key={r.id} className="glass p-4 rounded-2xl border border-white/05 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={r.userAvatar} alt={r.userName} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                    <span className="text-xs font-bold text-white">{r.userName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{r.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">{r.comment}</p>
                <span className="text-[10px] text-white/30 block">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
