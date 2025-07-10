"use client"

import { ConvexClientProvider } from '../ConvexClientProvider'
import { CartProvider } from "@/contexts/CartContext"

export default function BlockedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexClientProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ConvexClientProvider>
  )
} 