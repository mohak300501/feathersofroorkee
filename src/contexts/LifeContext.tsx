import React, { createContext, useContext, useEffect, useState } from 'react'

type Life = 'bird' | 'mammal' | 'reptile' | 'amphibian' | 'aquatic' | 'insect' | 'butterfly' | 'spider' | 'honeybee' | 'plant'

interface LifeContextType {
  life: Life
  toggleLife: () => void
}

const LifeContext = createContext<LifeContextType | undefined>(undefined)

export const useLife = () => {
  const context = useContext(LifeContext)
  if (context === undefined) {
    throw new Error('useLife must be used within a LifeProvider')
  }
  return context
}

export const LifeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [life, setLife] = useState<Life>(() => {
    // Check local storage or system preference
    const saved = localStorage.getItem('life') as Life
    if (saved) return saved
    
    return 'bird' // Default to bird if no preference is found
  })

  useEffect(() => {
    localStorage.setItem('life', life)
  }, [life])

  const toggleLife = () => {
    setLife(prev => {
      if (prev === 'bird') return 'fish'
      if (prev === 'fish') return 'plant'
      return 'bird'
    })
  }

  return (
    <LifeContext.Provider value={{ life, toggleLife }}>
      {children}
    </LifeContext.Provider>
  )
}