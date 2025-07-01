"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface FilterContextType {
  priceRange: number[]
  setPriceRange: (range: number[]) => void
  selectedBrands: string[]
  setSelectedBrands: (brands: string[]) => void
  selectedConditions: string[]
  setSelectedConditions: (conditions: string[]) => void
  yearRange: number[]
  setYearRange: (range: number[]) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedCity: string
  setSelectedCity: (city: string) => void
  distanceRadius: number[]
  setDistanceRadius: (radius: number[]) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [priceRange, setPriceRange] = useState<number[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [yearRange, setYearRange] = useState<number[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState("")
  const [distanceRadius, setDistanceRadius] = useState<number[]>([5])

  return (
    <FilterContext.Provider
      value={{
        priceRange,
        setPriceRange,
        selectedBrands,
        setSelectedBrands,
        selectedConditions,
        setSelectedConditions,
        yearRange,
        setYearRange,
        selectedCategories,
        setSelectedCategories,
        selectedCity,
        setSelectedCity,
        distanceRadius,
        setDistanceRadius,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
} 