import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button" 
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import Image from "next/image"

interface ImagePreviewProps {
  images: string[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function ImagePreview({ images, isOpen, onClose, initialIndex = 0 }: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }, [currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleResetZoom = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "ArrowLeft") goToPrevious()
      if (e.key === "ArrowRight") goToNext()
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, goToPrevious, goToNext, onClose])

  useEffect(() => {
    const imageElement = imageRef.current
    if (!imageElement || !isOpen) return

    const touchStartHandler = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const distance = getTouchDistance(e.touches as any)
        setLastTouchDistance(distance)
      } else if (e.touches.length === 1) {
        setIsDragging(true)
        setDragStart(prev => ({
          x: e.touches[0].clientX - prev.x,
          y: e.touches[0].clientY - prev.y
        }))
      }
    }

    const touchMoveHandler = (e: TouchEvent) => {
      e.preventDefault()
      
      if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches as any)
        setLastTouchDistance(prevDistance => {
          if (prevDistance > 0) {
            const scale = currentDistance / prevDistance
            setZoom(prev => Math.min(Math.max(prev * scale, 0.5), 5))
          }
          return currentDistance
        })
      } else if (e.touches.length === 1) {
        setDragStart(prevStart => {
          setPanOffset({
            x: e.touches[0].clientX - prevStart.x,
            y: e.touches[0].clientY - prevStart.y
          })
          return prevStart
        })
      }
    }

    const touchEndHandler = () => {
      setIsDragging(false)
      setLastTouchDistance(0)
    }

    imageElement.addEventListener("touchstart", touchStartHandler, { passive: false })
    imageElement.addEventListener("touchmove", touchMoveHandler, { passive: false })
    imageElement.addEventListener("touchend", touchEndHandler, { passive: false })

    return () => {
      imageElement.removeEventListener("touchstart", touchStartHandler)
      imageElement.removeEventListener("touchmove", touchMoveHandler)
      imageElement.removeEventListener("touchend", touchEndHandler)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">Image Preview</DialogTitle>
      <DialogDescription className="sr-only">
        Full screen image preview. Use arrow keys to navigate between images. Use zoom controls or pinch to zoom on mobile. Mouse wheel to zoom on desktop. Drag to pan when zoomed in.
      </DialogDescription>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none"
      >
                  <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 text-white hover:bg-black/70"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-50 flex flex-col space-y-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={handleResetZoom}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* Zoom Level Indicator */}
            {zoom !== 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {Math.round(zoom * 100)}%
              </div>
            )}

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white hover:bg-black/70"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white hover:bg-black/70"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <div 
            ref={imageRef}
            className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none'
            }}
          >
            <div
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              className="flex items-center justify-center"
            >
              <Image
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`Image ${currentIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain select-none"
                priority
                draggable={false}
              />
            </div>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 