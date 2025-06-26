import { cn } from "@/components/lib/utils"

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "spinner" | "dots" | "pulse" | "skeleton"
  className?: string
  text?: string
}

export default function Loader({ 
  size = "md", 
  variant = "spinner", 
  className, 
  text 
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base", 
    xl: "text-lg"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      {variant === "spinner" && (
        <div className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )} />
      )}

      {variant === "dots" && (
        <div className="flex space-x-1">
          <div className={cn(
            "animate-bounce rounded-full bg-blue-600",
            sizeClasses[size]
          )} style={{ animationDelay: "0ms" }} />
          <div className={cn(
            "animate-bounce rounded-full bg-blue-600",
            sizeClasses[size]
          )} style={{ animationDelay: "150ms" }} />
          <div className={cn(
            "animate-bounce rounded-full bg-blue-600", 
            sizeClasses[size]
          )} style={{ animationDelay: "300ms" }} />
        </div>
      )}

      {variant === "pulse" && (
        <div className={cn(
          "animate-pulse rounded-full bg-blue-600",
          sizeClasses[size]
        )} />
      )}

      {variant === "skeleton" && (
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded animate-pulse w-24" />
          <div className="h-4 bg-gray-300 rounded animate-pulse w-16" />
          <div className="h-4 bg-gray-300 rounded animate-pulse w-20" />
        </div>
      )}

      {text && (
        <p className={cn(
          "text-gray-600 font-medium animate-pulse",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

export function FullScreenLoader({ text = "Загрузка..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Loader size="lg" text={text} />
    </div>
  )
}

export function PageLoader({ text = "Загрузка..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader size="md" text={text} />
    </div>
  )
}

export function InlineLoader({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return <Loader size={size} className="inline-flex" />
} 