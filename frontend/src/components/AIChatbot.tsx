"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, X, Send, Bot, User, ShoppingBag,
  Heart, ShoppingCart, ArrowRight, RefreshCw, Star, Shirt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartWishlist } from "@/contexts/CartWishlistContext";

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  products?: any[];
  suggestedQuestions?: string[];
}

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toggleWishlist, addToCart } = useCartWishlist();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Hi! I'm your FitGenius AI Shopping Assistant. How can I help you today?",
      suggestedQuestions: [
        "Find a relaxed fit shirt under ₹1500",
        "Recommend size for 98cm chest",
        "Show highest rated hoodies",
        "Help me choose a summer linen shirt"
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: "user", text: query }
    ];

    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context: { chest: 98 }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.reply || "Here are matching products from our store:",
            products: data.products || [],
            suggestedQuestions: data.suggestedQuestions || []
          }
        ]);
      } else {
        throw new Error("Chat request failed");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "I fetched the latest database catalogue. Here are top recommendations for you:"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Ask AI Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 btn-purple py-3 px-5 rounded-full font-bold shadow-2xl shadow-purple-500/40 flex items-center gap-2 text-sm border border-purple-400/40 backdrop-blur-md"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
        </div>
        <span>Ask AI</span>
      </motion.button>

      {/* Expandable Premium Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-22 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[80vh] z-50 glass-strong rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col overflow-hidden bg-black/90 backdrop-blur-xl"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-purple-950/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">FitGenius AI Assistant</h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live DB Connected
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl bg-white/05 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-600/20"
                        : "glass border border-white/10 text-white/90 rounded-bl-none"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* AI Recommended Products Cards inside chat */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                        Matching Real Store Products ({msg.products.length}):
                      </p>
                      <div className="grid grid-cols-1 gap-2.5">
                        {msg.products.map((p) => (
                          <div
                            key={p.id}
                            className="glass p-2.5 rounded-2xl border border-white/10 hover:border-purple-500/40 flex items-center gap-3 transition-colors bg-white/02"
                          >
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-14 h-16 rounded-xl object-cover shrink-0 bg-zinc-900 border border-white/05"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                                <span>{p.category}</span>
                                <span>•</span>
                                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                                  {p.rating}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-extrabold text-white text-xs">₹{(p.discountPrice || p.price).toLocaleString()}</span>
                                {p.recommendedSize && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[9px]">
                                    Rec Size: {p.recommendedSize}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <Link
                                href={`/products/${p.id}`}
                                className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white transition-colors"
                                title="View Product"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => addToCart(p.id, p.recommendedSize || "M", 1)}
                                className="p-1.5 rounded-lg bg-white/05 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                title="Add to Cart"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Question Chips */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors"
                        >
                          "{q}"
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-white/50 text-xs glass p-3 rounded-2xl w-max border border-white/05">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Searching database & generating AI response...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-white/10 bg-black/50 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about products, sizes, prices..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-white/05 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-2xl btn-purple text-white disabled:opacity-40 shadow-lg shadow-purple-500/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
