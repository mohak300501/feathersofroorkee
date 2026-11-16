import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Edit2, Trash2, Pen, Quote } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import type { WalkExperience } from '../../interfaces/Walk'
import WalkExperienceModal from './WalkExperienceModal'
import toast from 'react-hot-toast'

interface WalkExperiencesProps {
  experiences: WalkExperience[]
  user?: any
  isAdmin?: boolean
  onAddExperience: (info: string) => Promise<void>
  onEditExperience: (experienceId: string, info: string) => Promise<void>
  onDeleteExperience: (experienceId: string) => Promise<void>
}

const WalkExperiences = ({ experiences, onAddExperience, onEditExperience, onDeleteExperience }: WalkExperiencesProps) => {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [experienceToEdit, setExperienceToEdit] = useState<WalkExperience | null>(null)
  const [isAddingExperience, setIsAddingExperience] = useState(false)

  const handleAddExperience = () => {
    if (!user) {
      toast('Please login to share your experience', { icon: 'ℹ️' });
      navigate('/login');
      return;
    }
    setIsAddingExperience(true)
  }

  return (
    <section className="space-y-6 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Walk Experiences
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reflections shared by participants from this birdwalk.
          </p>
        </div>
        <button
          onClick={handleAddExperience}
          className="btn-primary py-2.5 px-4 text-sm inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Pen className="w-4 h-4" />
          <span>Share Your Experience</span>
        </button>
      </div>

      {experiences.length > 0 ? (
        <div className="space-y-4">
          {experiences.map((experience) => {
            const date = new Date(experience.addedAt)
            const hasValidDate = !Number.isNaN(date.getTime())

            return (
              <article
                key={experience.id}
                className="glass-card flex items-start gap-4 p-5 md:p-6"
              >
                <Quote className="w-6 h-6 shrink-0 text-primary-500 mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {experience.info}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2 font-medium text-primary-600 dark:text-primary-400">
                      <Pen className="w-4 h-4" />
                      @{experience.username}
                    </span>
                    {hasValidDate && (
                      <time
                        dateTime={date.toISOString()}
                        className="inline-flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        {format(date, 'MMM dd, yyyy • HH:mm')}
                      </time>
                    )}
                  </div>
                </div>
                {(user?.uid === experience.userId || isAdmin) && (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExperienceToEdit(experience)}
                      className="shrink-0 p-2 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Edit Your Experience"
                      aria-label="Edit Your Experience"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteExperience(experience.id)}
                      className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete experience"
                      aria-label="Delete experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center mx-auto">
            <Quote className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            No experiences shared yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Were you part of this walk? Be the first to share your reflections or highlights!
          </p>
        </div>
      )}

      {(isAddingExperience || experienceToEdit) && (
        <WalkExperienceModal
          title={experienceToEdit ? 'Edit Your Experience' : 'Share Your Experience'}
          initialInfo={experienceToEdit?.info}
          submitLabel={experienceToEdit ? 'Save Changes' : 'Share Experience'}
          onClose={() => {
            setIsAddingExperience(false)
            setExperienceToEdit(null)
          }}
          onSubmit={(experienceInfo) => experienceToEdit
            ? onEditExperience(experienceToEdit.id, experienceInfo)
            : onAddExperience(experienceInfo)}
        />
      )}
    </section>
  )
}

export default WalkExperiences;
