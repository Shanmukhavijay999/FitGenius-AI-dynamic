"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, CreditCard, MapPin, CheckCircle2, ArrowRight,
  Sparkles, Lock, ArrowLeft, RefreshCw, Smartphone, Wallet,
  Building, Check, AlertCircle, ShoppingBag, QrCode, Copy,
  CheckCircle, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { ToastContainer, ToastMessage } from "@/components/Toast";

interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: number;
}

interface CartSummary {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  items: any[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { refreshCartCount } = useCartWishlist();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>("");
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [checkoutData, setCheckoutData] = useState<any | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrTimer, setQrTimer] = useState(599); // 10 min countdown timer

  // Form Fields
  const [upiIdInput, setUpiIdInput] = useState("");
  const [cardNumber, setCardNumber] = useState("4532 8901 2345 6789");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("890");
  const [cardName, setCardName] = useState(user?.name || "Alex Johnson");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // New Address Form Fields
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newPhone, setNewPhone] = useState(user?.phone || "+91 98765 43210");
  const [newLine1, setNewLine1] = useState("");
  const [newCity, setNewCity] = useState("Bengaluru");
  const [newState, setNewState] = useState("Karnataka");
  const [newPincode, setNewPincode] = useState("560102");

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, description?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  // Load Addresses & Cart Summary
  useEffect(() => {
    async function loadCheckoutData() {
      setLoading(true);
      try {
        const [resAddr, resCart] = await Promise.all([
          fetch("/api/v1/addresses", { headers: getHeaders() }),
          fetch("/api/v1/cart", { headers: getHeaders() }),
        ]);

        if (resAddr.ok) {
          const addrs = await resAddr.json();
          setAddresses(addrs);
          if (addrs.length > 0) {
            const def = addrs.find((a: Address) => a.is_default) || addrs[0];
            setSelectedAddrId(def.id);
          }
        }

        if (resCart.ok) {
          const cart = await resCart.json();
          setCartSummary(cart);
          if (cart.items.length === 0) {
            addToast("info", "Cart is Empty", "Add items to cart before checking out.");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadCheckoutData();
  }, [getHeaders]);

  // QR Code Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (showPaymentModal && qrTimer > 0) {
      interval = setInterval(() => setQrTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, qrTimer]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/addresses", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          line1: newLine1,
          city: newCity,
          state: newState,
          pincode: newPincode,
          is_default: 1,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setAddresses((prev) => [created, ...prev]);
        setSelectedAddrId(created.id);
        setShowNewAddressForm(false);
        addToast("success", "Address Saved", "Delivery address added.");
      }
    } catch (e) {
      addToast("error", "Error saving address", "Try again.");
    }
  };

  const handleInitiatePaymentModal = async () => {
    setProcessingPayment(true);
    try {
      const selectedAddr = addresses.find((a) => a.id === selectedAddrId);
      const addrStr = selectedAddr
        ? `${selectedAddr.name}, ${selectedAddr.line1}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}. Phone: ${selectedAddr.phone}`
        : "Flat 402, Quantum Towers, HSR Layout, Bengaluru, Karnataka - 560102";

      // 1. Create order on backend
      const resOrder = await fetch("/api/v1/checkout/create-order", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          addressId: selectedAddrId,
          shippingAddress: addrStr,
        }),
      });

      if (!resOrder.ok) throw new Error("Order creation failed");
      const data = await resOrder.json();
      setCheckoutData(data);
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error(err);
      addToast("error", "Checkout Error", err.message || "Could not create order.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const verifyPaymentOnServer = async () => {
    if (!checkoutData) return;
    setProcessingPayment(true);

    try {
      const resVerify = await fetch("/api/v1/payments/verify", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          orderId: checkoutData.orderId,
          razorpay_order_id: checkoutData.razorpayOrderId,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: "demo_verified_sig",
          payment_method: activeTab.toUpperCase(),
        }),
      });

      if (!resVerify.ok) throw new Error("Payment verification failed");
      const verifyData = await resVerify.json();

      setShowPaymentModal(false);
      setOrderConfirmed(verifyData);
      setStep(4);
      refreshCartCount();
      addToast("success", "Payment Verified & Order Placed! 🎉", `Order ID: ${checkoutData.orderId}`);
    } catch (e) {
      console.error(e);
      addToast("error", "Verification Error", "Could not verify payment.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("fitgenius@upi");
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalAmount = cartSummary?.totalAmount || 0;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    `upi://pay?pa=fitgenius@upi&pn=FitGenius+AI+Fashion&am=${totalAmount}&cu=INR&tn=Order_${checkoutData?.orderId || "101"}`
  )}`;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 pt-8 pb-20 space-y-8">
        {/* Stepper Header */}
        <div className="glass-strong rounded-3xl p-6 border border-white/08">
          <div className="flex items-center justify-between max-w-2xl mx-auto text-xs">
            {[
              { num: 1, label: "Address" },
              { num: 2, label: "Summary" },
              { num: 3, label: "Payment" },
              { num: 4, label: "Confirmation" },
            ].map((s) => {
              const active = step === s.num;
              const done = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400"
                        : "glass text-white/40 border border-white/10"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`hidden sm:inline font-bold ${active ? "text-white" : "text-white/40"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Delivery Address */}
        {step === 1 && (
          <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-400" />
                <span>Step 1: Select Delivery Address</span>
              </h2>
              <button
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-xs text-purple-400 font-bold hover:underline"
              >
                {showNewAddressForm ? "Cancel" : "+ Add New Address"}
              </button>
            </div>

            {showNewAddressForm ? (
              <form onSubmit={handleAddAddress} className="space-y-4 bg-white/02 p-4 rounded-2xl border border-white/05">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    placeholder="House no, Street, Colony"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-purple py-2.5 px-5 text-xs font-bold rounded-xl">
                  Save Address
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.length === 0 ? (
                  <div className="p-4 rounded-2xl glass border border-white/10 text-xs text-white/60">
                    No address found. Click "+ Add New Address" above.
                  </div>
                ) : (
                  addresses.map((a) => {
                    const isSelected = selectedAddrId === a.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAddrId(a.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-500/20"
                            : "glass border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-white">{a.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                        <p className="text-[11px] text-white/40 mt-2 font-mono">Phone: {a.phone}</p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedAddrId && addresses.length > 0}
                className="btn-purple py-3 px-6 text-xs font-bold rounded-xl inline-flex items-center gap-2"
              >
                <span>Continue to Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Order Summary */}
        {step === 2 && cartSummary && (
          <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <span>Step 2: Order Summary</span>
              </h2>
              <button onClick={() => setStep(1)} className="text-xs text-white/40 hover:text-white">
                Change Address
              </button>
            </div>

            <div className="space-y-3">
              {cartSummary.items.map((item) => (
                <div key={item.id} className="glass p-3 rounded-2xl border border-white/05 flex items-center gap-4">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-14 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white">{item.product.name}</h4>
                    <span className="text-[10px] text-purple-300 font-bold">Size: {item.size} • Qty: {item.quantity}</span>
                  </div>
                  <div className="text-right text-xs font-extrabold text-white">
                    ₹{item.subtotal.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/02 p-4 rounded-2xl border border-white/05 space-y-2 text-xs">
              <div className="flex justify-between text-white/60"><span>Subtotal</span><span>₹{cartSummary.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-emerald-400 font-semibold"><span>Discount</span><span>- ₹{cartSummary.discount.toLocaleString()}</span></div>
              <div className="flex justify-between text-white/60"><span>Delivery Fee</span><span>{cartSummary.deliveryCharge === 0 ? "FREE" : `₹${cartSummary.deliveryCharge}`}</span></div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-sm text-white">
                <span>Total Amount</span>
                <span className="text-purple-300 font-mono">₹{cartSummary.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button onClick={() => setStep(1)} className="btn-ghost py-2.5 px-4 text-xs font-bold rounded-xl">
                Back
              </button>
              <button onClick={() => setStep(3)} className="btn-purple py-3 px-6 text-xs font-bold rounded-xl inline-flex items-center gap-2">
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Gateway Selection */}
        {step === 3 && cartSummary && (
          <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Step 3: Razorpay & UPI Payment</span>
              </h2>
              <p className="text-xs text-white/40 mt-1">Select your payment method below to open the scannable UPI QR Code & Payment Gateway.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "upi", title: "UPI / QR Code", icon: QrCode, desc: "Scan QR Code with GPay, PhonePe, Paytm, BHIM" },
                { id: "card", title: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay Cards" },
                { id: "netbanking", title: "Net Banking", icon: Building, desc: "HDFC, SBI, ICICI, Axis, Kotak" },
                { id: "wallet", title: "Wallets", icon: Wallet, desc: "Paytm, Mobikwik, Amazon Pay" },
              ].map((m) => {
                const isSel = activeTab === m.id;
                const Icon = m.icon;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveTab(m.id as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                      isSel ? "bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/20 ring-1 ring-purple-400" : "glass border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSel ? "bg-purple-500 text-white" : "bg-white/05 text-white/50"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{m.title}</h4>
                      <p className="text-[11px] text-white/40">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
              <div>
                <span className="font-bold">Total Amount to Pay:</span>
                <p className="text-xl font-black text-white font-mono">₹{cartSummary.totalAmount.toLocaleString()}</p>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300">
                🔒 256-Bit SSL Encrypted
              </span>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button onClick={() => setStep(2)} className="btn-ghost py-2.5 px-4 text-xs font-bold rounded-xl">
                Back
              </button>

              <button
                onClick={handleInitiatePaymentModal}
                disabled={processingPayment}
                className="btn-purple py-4 px-8 text-sm font-extrabold rounded-2xl inline-flex items-center gap-2 shadow-xl shadow-purple-500/40"
              >
                {processingPayment ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating QR Code & Gateway...
                  </span>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Pay ₹{cartSummary.totalAmount.toLocaleString()} (Open UPI QR / Gateway)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Order Confirmation */}
        {step === 4 && orderConfirmed && (
          <div className="glass-strong rounded-3xl p-8 md:p-12 border border-emerald-500/40 bg-emerald-950/10 text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                Payment Verified & Confirmed
              </span>
              <h2 className="text-3xl font-black text-white mt-3">Order Successfully Placed!</h2>
              <p className="text-xs text-white/60 mt-1">
                Order ID: <strong className="text-white font-mono">{orderConfirmed.orderId}</strong>
              </p>
            </div>

            <div className="glass p-4 rounded-2xl border border-white/05 text-left text-xs space-y-2">
              <div className="flex justify-between"><span className="text-white/50">Payment Status:</span><span className="text-emerald-400 font-bold">PAID</span></div>
              <div className="flex justify-between"><span className="text-white/50">Order Status:</span><span className="text-purple-300 font-bold">Confirmed</span></div>
              <div className="flex justify-between"><span className="text-white/50">Payment ID:</span><span className="font-mono text-white/80">{orderConfirmed.paymentId}</span></div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/orders" className="btn-purple py-3.5 px-8 text-xs font-bold rounded-2xl flex items-center gap-2">
                <span>Track Order in My Orders</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/shop" className="btn-ghost py-3.5 px-6 text-xs font-bold rounded-2xl">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Interactive Payment Gateway & UPI QR Code Modal Popup */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-strong rounded-3xl p-6 border border-purple-500/40 shadow-2xl space-y-6 relative bg-zinc-950/95 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Razorpay Payment Gateway</h3>
                  <span className="text-[10px] text-white/40 font-mono">Order #{checkoutData?.orderId}</span>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-xl bg-white/05 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Method Tabs inside Modal */}
            <div className="flex items-center gap-1 bg-white/05 p-1 rounded-2xl border border-white/05">
              {[
                { id: "upi", label: "UPI / QR" },
                { id: "card", label: "Card" },
                { id: "netbanking", label: "Net Banking" },
                { id: "wallet", label: "Wallet" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === t.id ? "bg-purple-500 text-white shadow-md shadow-purple-500/30" : "text-white/50 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Dynamic Scannable UPI QR Code */}
            {activeTab === "upi" && (
              <div className="space-y-4 text-center">
                <div className="inline-block p-3 rounded-2xl bg-white text-black shadow-xl border-4 border-purple-500/30 relative">
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-52 h-52 object-contain mx-auto"
                  />
                  <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                    Scan & Pay
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Scan QR with GPay, PhonePe, Paytm, or BHIM</p>
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Amount: <strong className="text-white">₹{totalAmount.toLocaleString()}</strong> • Expires in <strong className="text-amber-400 font-bold">{formatTimer(qrTimer)}</strong>
                  </p>
                </div>

                {/* VPA Copy Box */}
                <div className="flex items-center justify-between glass p-2.5 rounded-xl border border-white/10 text-xs">
                  <span className="text-white/60">UPI ID: <strong className="text-white font-mono">fitgenius@upi</strong></span>
                  <button
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-[10px] hover:bg-purple-500 hover:text-white transition-colors flex items-center gap-1"
                  >
                    {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUpi ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                {/* Direct VPA Input */}
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] uppercase font-bold text-white/40">Or Enter VPA / UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi or username@okicici"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    className="w-full bg-white/05 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Credit/Debit Card Form */}
            {activeTab === "card" && (
              <div className="space-y-3 text-xs text-left">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white/05 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-white/05 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-white/05 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Net Banking */}
            {activeTab === "netbanking" && (
              <div className="space-y-3 text-xs">
                <label className="block text-[10px] uppercase font-bold text-white/40 text-left">Select Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra"].map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBank(b)}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                        selectedBank === b ? "bg-purple-500/20 border-purple-500 text-purple-300" : "glass border-white/10 text-white/70"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Wallets */}
            {activeTab === "wallet" && (
              <div className="space-y-2 text-xs text-left">
                <p className="text-white/60">Select wallet to authorize payment:</p>
                {["Paytm Wallet", "PhonePe Wallet", "Mobikwik", "Amazon Pay"].map((w) => (
                  <div key={w} className="glass p-3 rounded-xl border border-white/10 font-bold flex items-center justify-between">
                    <span>{w}</span>
                    <span className="text-emerald-400 text-[10px]">Connected</span>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Action CTA */}
            <div className="space-y-2">
              <button
                onClick={verifyPaymentOnServer}
                disabled={processingPayment}
                className="btn-purple w-full py-3.5 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-500/40"
              >
                {processingPayment ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying Payment Signature...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{totalAmount.toLocaleString()} & Complete Order</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-white/30 text-center">
                Simulates Razorpay verification with backend SQLite database update.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
