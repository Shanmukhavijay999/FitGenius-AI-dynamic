import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

/** Primary body font – clean, legible, modern */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** Display / heading font – geometric, premium feel */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitGenius AI — Dynamic Size & Fit Chart Generator",
  description:
    "Enterprise AI SaaS platform that auto-generates apparel size charts from garment images and recommends the perfect fit for every customer.",
  keywords: ["size chart", "AI", "fashion", "fit recommendation", "apparel", "Gemini Vision"],
  openGraph: {
    title: "FitGenius AI — Dynamic Size & Fit Chart Generator",
    description: "Upload a garment image, get a dynamic size chart in seconds.",
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
        {children}
      </body>
    </html>
  );
}
