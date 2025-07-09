import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";  
import { ConvexClientProvider } from './ConvexClientProvider';
import OptimizedClientLayout from "@/components/OptimizedClientLayout"
import { CartProvider } from "@/contexts/CartContext"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ConvexClientProvider>
          <CartProvider>
            <OptimizedClientLayout>
              {children}
            </OptimizedClientLayout>
          </CartProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
