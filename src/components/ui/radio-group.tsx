"use client"

import * as React from "react"
import { cn } from "@/components/lib/utils"

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn("grid gap-2", className)}
        role="radiogroup"
        ref={ref}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  
  return (
    <input
      type="radio"
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      checked={context.value === props.value}
      onChange={(e) => {
        if (context.onValueChange && e.target.checked) {
          context.onValueChange(props.value as string)
        }
      }}
      {...props}
    />
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem } 