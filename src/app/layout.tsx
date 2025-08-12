import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";  
import { ConvexClientProvider } from './ConvexClientProvider';
import OptimizedClientLayout from "@/components/OptimizedClientLayout"
import { CartProvider } from "@/contexts/CartContext"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reseller Bot",
  description: "A marketplace for reselling items",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script 
          src="https://yookassa.ru/payouts-data/3.1.0/widget.js" 
          strategy="beforeInteractive"
        />
        <Script src="https://cdn.jsdelivr.net/npm/@cdek-it/widget@3" strategy="beforeInteractive" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ConvexClientProvider>
          <CartProvider>
            <OptimizedClientLayout>
              {children}
            </OptimizedClientLayout>
            <Toaster />
          </CartProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
