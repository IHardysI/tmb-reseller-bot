export const DEFAULT_PLATFORM_FEE_RATE = 0.08

export const PLATFORM_FEE_RATE: number = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_PLATFORM_FEE_RATE
    if (!raw) return DEFAULT_PLATFORM_FEE_RATE
    const parsed = parseFloat(raw)
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed
    return DEFAULT_PLATFORM_FEE_RATE
  } catch {
    return DEFAULT_PLATFORM_FEE_RATE
  }
})()

export function computePlatformFee(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0
  return Math.round(subtotal * PLATFORM_FEE_RATE)
}

