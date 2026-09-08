import { useState, useEffect } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { Trophy, Medal, Camera } from 'lucide-react'

interface Leader {
  userId: string
  username: string
  count: number
}

const LeaderBoard = () => {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await fetch('/api/General/leaderBoard')
        const data = await response.json()
        
        if (data.success && data.leaders) {
          setLeaders(data.leaders)
        } else {
          console.error('Failed to fetch leaderboard:', data.error)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaders()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  const top3 = leaders.slice(0, 3)
  const rest = leaders.slice(3)

  return (
    <div className="space-y-12 animate-fade-in relative z-10 py-8 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-2 shadow-lg shadow-yellow-500/30">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h1 className="section-header">
          Top Contributors
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Celebrating the photographers who have shared the most beautiful moments
        </p>
      </div>

      {leaders.length === 0 ? (
        <div className="glass-card text-center py-16">
          <Camera className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-600 dark:text-slate-300">No contributions yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Start uploading photos to appear on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-8 pt-10 pb-16 px-4">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center animate-slide-up w-full md:w-1/3 order-2 md:order-1" style={{ animationDelay: '100ms' }}>
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500 border-4 border-slate-300 shadow-xl">
                    {top3[1].username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-slate-300 rounded-full p-1.5 border-2 border-white dark:border-slate-900 shadow-sm">
                    <Medal className="h-6 w-6 text-slate-600" />
                  </div>
                </div>
                <div className="glass-card w-full text-center p-6 bg-gradient-to-b from-white/80 to-slate-100/80 dark:from-dark-surface/80 dark:to-slate-800/80 transform transition hover:-translate-y-2 duration-300">
                  <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 truncate w-full">{top3[1].username}</h3>
                  <div className="mt-2 flex items-center justify-center space-x-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                    <Camera className="h-4 w-4" />
                    <span>{top3[1].count} Photos</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="flex flex-col items-center animate-slide-up w-full md:w-1/3 order-1 md:order-2 z-10" style={{ animationDelay: '0ms' }}>
                <div className="relative mb-6">
                  <div className="w-28 h-28 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-4xl font-bold text-yellow-600 dark:text-yellow-500 border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-400/20">
                    {top3[0].username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full p-2 border-2 border-white dark:border-slate-900 shadow-lg">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="glass-card w-full text-center p-8 bg-gradient-to-b from-yellow-50/90 to-yellow-100/50 dark:from-yellow-900/20 dark:to-dark-surface/90 border-yellow-200/50 dark:border-yellow-700/30 transform transition hover:-translate-y-2 duration-300 scale-105">
                  <h3 className="font-display font-bold text-2xl text-yellow-900 dark:text-yellow-400 truncate w-full">{top3[0].username}</h3>
                  <div className="mt-3 flex items-center justify-center space-x-2 text-yellow-700 dark:text-yellow-500 font-bold text-lg">
                    <Camera className="h-5 w-5" />
                    <span>{top3[0].count} Photos</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center animate-slide-up w-full md:w-1/3 order-3" style={{ animationDelay: '200ms' }}>
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-orange-700 dark:text-orange-500 border-4 border-orange-300 shadow-xl">
                    {top3[2].username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-orange-300 rounded-full p-1.5 border-2 border-white dark:border-slate-900 shadow-sm">
                    <Medal className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
                <div className="glass-card w-full text-center p-6 bg-gradient-to-b from-white/80 to-orange-50/80 dark:from-dark-surface/80 dark:to-orange-900/10 transform transition hover:-translate-y-2 duration-300">
                  <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 truncate w-full">{top3[2].username}</h3>
                  <div className="mt-2 flex items-center justify-center space-x-1.5 text-primary-600 dark:text-primary-400 font-semibold">
                    <Camera className="h-4 w-4" />
                    <span>{top3[2].count} Photos</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List for Rest */}
          {rest.length > 0 && (
            <div className="glass-card p-0 overflow-hidden max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {rest.map((leader, index) => (
                  <div key={leader.userId} className="flex items-center justify-between p-5 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center space-x-4 md:space-x-6">
                      <div className="text-xl md:text-2xl font-bold text-slate-400 dark:text-slate-500 w-8 text-center">
                        #{index + 4}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-300 shadow-inner">
                        {leader.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                        {leader.username}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl text-primary-700 dark:text-primary-400 font-medium">
                      <Camera className="h-4 w-4" />
                      <span>{leader.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default LeaderBoard
