import { useState, useEffect } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckSquare } from 'lucide-react'

interface Bird {
  id: string
  commonName: string
  scientificName: string
  familyName: string
  familyDisplay: string
  commonCode: string
}

const CheckList = () => {
  const [birds, setBirds] = useState<Bird[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBirds = async () => {
      try {
        const response = await fetch('/api/Bird/getBirds')
        const data = await response.json()

        if (data.success && data.birds) {
          setBirds(data.birds)
        } else {
          console.error('Failed to fetch birds:', data.error)
        }
      } catch (error) {
        console.error('Error fetching birds:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBirds()
  }, [])

  const sortedFamilies: string[] = []
  const groupedBirds = birds.reduce((acc, bird) => {
    const family = bird.familyName
    if (!acc[family]) {
      acc[family] = []
      sortedFamilies.push(family)
    }
    acc[family].push(bird)
    return acc
  }, {} as Record<string, Bird[]>)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-10 animate-fade-in relative z-10 py-8 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 rounded-2xl mb-2">
          <CheckSquare className="h-10 w-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="section-header">
          Roorkee Bird Checklist
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          A comprehensive taxonomic list of bird species found in the region
        </p>
      </div>

      <div className="glass-card p-6 md:p-10">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Taxonomic Checklist</h2>
          <span className="text-sm font-medium bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-slate-600 dark:text-slate-400">
            {birds.length} Species
          </span>
        </div>

        {birds.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No birds available in the checklist.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedFamilies.map(family => (
              <div key={family} className="animate-slide-up space-y-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 border-l-4 border-primary-500 pl-4 py-1 bg-slate-50 dark:bg-dark-surface/50 rounded-r-lg">
                  {family}
                </h3>
                <ul className="pl-6 space-y-2">
                  {groupedBirds[family].map((bird) => (
                    <li key={bird.id} className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition-colors">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-lg">
                        {bird.commonName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 italic text-sm">
                        {bird.scientificName}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckList
