import { useState, useEffect } from 'react'
import BirdCard from '../components/BirdCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Search, Bird as BirdIcon, Camera, Users, Dna, Info, Plus } from 'lucide-react'
import { IUCN_STATUS_MAP } from '../utils/iucn_map'
import { useAuth } from '../contexts/AuthContext'
import AddBirdModal, { FamilyData } from '../components/AddBirdModal'
import toast from 'react-hot-toast'

const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!target) return;
    let start = 0;
    const duration = 2000;
    const increment = Math.max(target / (duration / 16), 1); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}</span>
}

interface Bird {
  id: string
  commonName: string
  scientificName: string
  familyName: string
  familyDisplay: string
  photoCount: number
  featuredPhoto: string
  commonCode: string
  iucnStatus: string
  isMigratory: boolean
}

interface Stats {
  totalFamilies: number
  totalBirds: number
  totalPhotos: number
  totalUsers: number
}

const Home = () => {
  const { user, isAdmin } = useAuth()
  const [birds, setBirds] = useState<Bird[]>([])
  const [families, setFamilies] = useState<FamilyData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)

  const fetchBirds = async () => {
    try {
      const response = await fetch('/api/Bird/getBirds');
      const data = await response.json();

      if (data.success && data.birds) {
        setBirds(data.birds)
      } else {
        console.error('Failed to fetch birds:', data.error, data.details || '')
      }
    } catch (error) {
      console.error('Error fetching birds:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {


    const fetchStats = async () => {
      try {
        const response = await fetch('/api/General/publicStats');
        if (response.ok) {
          const data = await response.json();
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    const fetchFamilies = async () => {
      if (isAdmin) {
        try {
          const response = await fetch('/api/Bird/getFamilies')
          if (response.ok) {
            const data = await response.json()
            if (data.success) setFamilies(data.families)
          }
        } catch (error) {
          console.error('Error fetching families:', error)
        }
      }
    }

    fetchBirds()
    fetchStats()
    fetchFamilies()
  }, [isAdmin])

  const handleAddBird = async (commonName: string, scientificName: string, familyId: string, iucnStatus: string, isMigratory: boolean, info: string) => {
    setAdding(true)
    try {
      const response = await fetch('/api/Bird/addBird', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commonName, scientificName, familyId, userId: user?.uid, iucnStatus, isMigratory, info }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add bird')
      }
      toast.success('Bird added successfully!')
      setStats(prev => prev ? { ...prev, totalBirds: prev.totalBirds + 1 } : prev)
      await fetchBirds()
      setShowAddModal(false)
    } catch (error: any) {
      console.error('Error adding bird:', error)
      toast.error(error.message || 'Failed to add bird')
    } finally {
      setAdding(false)
    }
  }

  const filteredBirds = birds.filter(bird =>
    bird.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bird.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bird.commonCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bird.familyDisplay && bird.familyDisplay.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedFamilies: string[] = []
  const groupedBirds = filteredBirds.reduce((acc, bird) => {
    const family = bird.familyDisplay || bird.familyName || 'Uncategorized'
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
    <div className="space-y-12 animate-fade-in relative z-10">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8 pb-4">
        <h1 className="section-header leading-tight">
          Feathers of Roorkee
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
          Discover the beauty of birds through stunning photography from Roorkee
        </p>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto px-4">
          <div className="glass-card flex flex-col items-center justify-center p-6 text-center hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3">
              <Dna className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">
              <AnimatedCounter target={stats.totalFamilies} />
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Families</p>
          </div>

          <div className="glass-card flex flex-col items-center justify-center p-6 text-center hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-3">
              <BirdIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">
              <AnimatedCounter target={stats.totalBirds} />
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Birds</p>
          </div>

          <div className="glass-card flex flex-col items-center justify-center p-6 text-center hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-bird-100 dark:bg-bird-900/30 rounded-full mb-3">
              <Camera className="h-8 w-8 text-bird-600 dark:text-bird-400" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">
              <AnimatedCounter target={stats.totalPhotos} />
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Photos</p>
          </div>

          <div className="glass-card flex flex-col items-center justify-center p-6 text-center hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">
              <AnimatedCounter target={stats.totalUsers} />
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Users</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="max-w-xl mx-auto relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-bird-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-primary-500 h-6 w-6 z-10" />
          <input
            type="text"
            placeholder="Search birds by name, scientific name, code, or family..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-lg text-lg"
          />
        </div>
      </div>
      <div className="flex justify-center">
        {user && isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2 whitespace-nowrap px-6 py-4 rounded-2xl shadow-lg shrink-0">
            <Plus className="h-6 w-6" />
            <span className="hidden sm:inline text-lg">Add Bird</span>
          </button>
        )}
      </div>

      {/* Birds Grid grouped by Family Name */}
      {filteredBirds.length === 0 ? (
        <div className="glass-card text-center py-16 max-w-lg mx-auto">
          <div className="p-4 bg-slate-100 dark:bg-dark-surface rounded-full inline-block mb-6 shadow-inner">
            <BirdIcon className="h-16 w-16 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            {searchTerm ? 'No birds found' : 'No birds available'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Check back later for beautiful bird photos'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {sortedFamilies.map(family => (
            <div key={family} className="animate-slide-up">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-8 pb-4 border-b border-slate-200 dark:border-slate-700 inline-block">
                {family}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {groupedBirds[family].map((bird) => (
                  <BirdCard
                    key={bird.id}
                    id={bird.id}
                    commonName={bird.commonName}
                    scientificName={bird.scientificName}
                    photoCount={bird.photoCount}
                    featuredPhoto={bird.featuredPhoto}
                    commonCode={bird.commonCode}
                    iucnStatus={bird.iucnStatus}
                    isMigratory={bird.isMigratory}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="glass-card max-w-4xl mx-auto p-6 mt-16 flex flex-col items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-5 w-5 text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300 font-medium text-base">Legend</span>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 w-full">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {Object.entries(IUCN_STATUS_MAP).map(([code, { label, color }]) => (
              <div key={code} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${color}`}>
                  {code}
                </div>
                <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>
          <div className="h-px w-full bg-slate-200 dark:bg-slate-700 block lg:hidden"></div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shadow-pink-500/30">
                M
              </div>
              <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">Migratory</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shadow-blue-500/30">
                R
              </div>
              <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">Resident</span>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddBirdModal
          families={families}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddBird}
          adding={adding}
        />
      )}
    </div>
  )
}

export default Home