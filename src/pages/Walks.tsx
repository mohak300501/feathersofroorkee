import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import WalkCard from '../components/WalkCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Plus, Leaf, Users, Heart, Handshake } from 'lucide-react'
import AddWalkModal from '../components/AddWalkModal'
import type { Walk } from '../interfaces/Walk'
import toast from 'react-hot-toast'

const Walks = () => {
  const { user, isAdmin } = useAuth()
  const [walks, setWalks] = useState<Walk[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchWalks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/Walk/getWalks')
      const data = await response.json()
      if (response.ok) {
        setWalks(data)
      } else {
        console.error('Failed to fetch walks:', data.error)
        toast.error(data.error || 'Failed to fetch walks')
      }
    } catch (error) {
      console.error('Error fetching walks:', error)
      toast.error('Network error loading walks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalks()
  }, [])

  // Group by month and year
  const groupedWalks = walks.reduce((acc, walk) => {
    const date = new Date(walk.datetime)
    const monthYear = !isNaN(date.getTime())
      ? date.toLocaleString('default', { month: 'long', year: 'numeric' })
      : 'Upcoming'
    if (!acc[monthYear]) {
      acc[monthYear] = []
    }
    acc[monthYear].push(walk)
    return acc
  }, {} as Record<string, Walk[]>)

  return (
    <div className="space-y-12 animate-fade-in relative z-10">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8 pb-4">
        <h1 className="section-header leading-tight">
          Weekend BirdWalks at Roorkee
        </h1>
        <div className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto font-medium">
          <p>
            In this technological age, our busy lives are filled with screens, schedules, and responsibilities. We have forgotten the simple joy of spending time in nature and marvelling at its magic. Stepping out into the wild, away from the chaos of the city, is known to bring lasting calmness, curiosity, and a refreshing sense of wonder.
          </p><br/>
          <p>
            So, we present to the citizens of Roorkee, an opportunity to connect with Mother Nature, through a blissful adventure filled with colourful feathers, melodious songs, and amazing stories from the Avian World!
          </p><br/>
          <p>
            We have already catalogued about 60 species inside the IITR campus, and nearly 180 across Roorkee, including winter migrants!
          </p>
        </div>
      </div>

      {/* Features/Details */}
      <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600 dark:text-primary-400">
            <Leaf className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Learn & Explore</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Learn to identify birds with visual and auditory cues, use binoculars and Merlin Bird ID app, explore habitats, diets, and unique traits.
          </p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-3">
           <div className="p-3 bg-bird-100 dark:bg-bird-900/30 rounded-full text-bird-600 dark:text-bird-400">
             <Heart className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-800 dark:text-white">Connect & Conserve</h3>
           <p className="text-sm text-slate-600 dark:text-slate-400">
             Enjoy sharing fun facts and folk tales, know about interdependence of birds and nature, adopt ethical and conservation practices.
           </p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-3">
           <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
             <Users className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-800 dark:text-white">Limited Batches</h3>
           <p className="text-sm text-slate-600 dark:text-slate-400">
             For a meaningful experience, each walk is limited to 40 participants inside IITR & 20 outside. Don't worry, more walks coming soon!
           </p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-3">
           <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
             <Handshake className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-800 dark:text-white">Join Us</h3>
           <p className="text-sm text-slate-600 dark:text-slate-400">
             Join our WhatsApp groups&nbsp;
             <a href="https://chat.whatsapp.com/Jo7u0ridi2f5IC0iP4ZqDa" target="_blank">IITR Bird-watching Family</a> and&nbsp;
             <a href="https://chat.whatsapp.com/HyMLq7aiGm7HiQiRJ1nzSq" target="_blank">BirdWalks</a> for event updates. Follow us on&nbsp;
             <a href="https://instagram.com/feathers_of_roorkee" target="_blank">Instagram</a>.
           </p>
        </div>
      </div>

      {/* Admin Controls */}
      {user && isAdmin && (
        <div className="flex justify-center">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Walk</span>
          </button>
        </div>
      )}

      {/* Walks List */}
      <div className="px-4 pb-12">
        <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-slate-200 mb-8 text-center">
          Upcoming & Past Walks
        </h2>
        
        {loading ? (
          <LoadingSpinner />
        ) : walks.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <p className="text-xl text-slate-600 dark:text-slate-400">No walks available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-12 max-w-7xl mx-auto">
             {Object.entries(groupedWalks).map(([monthYear, monthWalks]) => (
               <div key={monthYear} className="space-y-6">
                 <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 border-b-2 border-primary-500/30 pb-2 inline-block">
                   {monthYear}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {monthWalks.map(ws => (
                     <WalkCard key={ws.walkCode} {...ws} />
                   ))}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddWalkModal 
           onClose={() => setIsAddModalOpen(false)} 
           onSuccess={() => {
              setIsAddModalOpen(false)
              fetchWalks()
           }}
        />
      )}
    </div>
  )
}

export default Walks