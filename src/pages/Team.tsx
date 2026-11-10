import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

interface TeamMember {
  username: string
  userPhoto?: string
  status: 'Current' | 'Former'
}

const Team = () => {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/General/getTeamMembers')
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load team members')
        }
        setMembers(data.members)
      } catch (fetchError) {
        console.error('Error fetching team members:', fetchError)
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load team members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const renderMembers = (status: TeamMember['status'], title: string) => {
    const sectionMembers = members.filter(member => member.status === status)

    return (
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 pb-4 border-b border-slate-200 dark:border-slate-700">{title}</h2>
        {sectionMembers.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sectionMembers.map(member => {
              const photoUrl = member.userPhoto
                ? (member.userPhoto.startsWith('http')
                    ? member.userPhoto
                    : `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${member.userPhoto}`)
                : null

              return (
                <article key={`${status}-${member.username}`} className="glass rounded-2xl overflow-hidden shadow-lg">
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                    {photoUrl ? (
                      <img src={photoUrl} alt={`@${member.username}`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UserRound className="w-20 h-20" />
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">@{member.username}</h3>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No {status.toLowerCase()} members to show yet.</p>
        )}
      </section>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <header className="space-y-5">
        <h1 className="section-header text-center">Team</h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
          We are a small team of IITR students who set out on our cycles through the jungles of Roorkee.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-center text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <>
          {renderMembers('Current', 'Current Members')}
          {renderMembers('Former', 'Former Members')}
        </>
      )}
    </div>
  )
}

export default Team
