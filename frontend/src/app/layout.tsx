import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartWishlistProvider } from "@/contexts/CartWishlistContext";
import { Navbar } from "@/components/Navbar";
import { AIChatbot } from "@/components/AIChatbot";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitGenius AI — AI-Powered Fashion Shopping Platform",
  description:
    "Enterprise AI SaaS fashion platform with automated size charts, instant AI fit recommendation, wishlist, cart, orders, and Razorpay payment gateway.",
  keywords: ["size chart", "AI", "fashion", "fit recommendation", "e-commerce", "shopping assistant"],
  openGraph: {
    title: "FitGenius AI — AI-Powered Fashion Platform",
    description: "Find your perfect size, shop apparel with instant AI recommendations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} scroll-smooth`}
    >
      <body className="min-h-screen antialiased bg-black text-white overflow-x-hidden">
        <AuthProvider>
          <CartWishlistProvider>
            <Navbar />
            <div className="pt-16 min-h-screen">
              {children}
            </div>
            <AIChatbot />
          </CartWishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
