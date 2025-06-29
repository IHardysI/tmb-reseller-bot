import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface FloatingActionButtonProps {
  onClick?: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className = "" }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`fab-button fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 z-50 border-2 border-white/20 ${className}`}
      size="icon"
    >
      <Plus className="h-7 w-7 stroke-2" />
    </Button>
  )
} 