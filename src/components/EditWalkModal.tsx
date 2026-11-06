import { useState } from 'react'
import { X, Calendar, MapPin, AlignLeft, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { Walk } from '../interfaces/Walk'
import { parseApiResponse } from '../utils/imageCompressor'

interface EditWalkModalProps {
  walk: Walk
  onClose: () => void
  onSuccess: () => void
}

const EditWalkModal = ({ walk, onClose, onSuccess }: EditWalkModalProps) => {
  const { user } = useAuth()

  // Initialize with existing walk data safely
  let localISOTime = ''
  try {
    const dateObj = new Date(walk.datetime)
    if (!isNaN(dateObj.getTime())) {
      const tzOffset = dateObj.getTimezoneOffset() * 60000
      localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16)
    }
  } catch {
    localISOTime = ''
  }

  const [title, setTitle] = useState(walk.title || '')
  const [info, setInfo] = useState(walk.info || '')
  const [datetime, setDatetime] = useState(localISOTime)
  const [location, setLocation] = useState(walk.location || '')
  const [mapPin, setMapPin] = useState(walk.mapPin || '')
  const [limit, setLimit] = useState<number>(walk.limit || 25)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !info || !datetime || !location) {
      setError('Please fill all required fields.')
      return
    }

    if (limit < 1) {
      setError('Participant limit must be at least 1.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        walkId: walk._id,
        title,
        info,
        datetime,
        location,
        mapPin,
        limit: Number(limit),
        userId: user?.uid
      }

      const response = await fetch('/api/Walk/editWalk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await parseApiResponse(response)
      if (data && data.success) {
        onSuccess()
      } else {
        setError(data?.error || 'Failed to update walk')
      }
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-dark-border">
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Edit Walk</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <form id="edit-walk-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Walk Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date and Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location Name
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Google Maps Link (Optional)
                </label>
                <input
                  type="url"
                  value={mapPin}
                  onChange={(e) => setMapPin(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-500" /> Participant Limit
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                  placeholder="e.g., 25"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> Walk Description
              </label>
              <textarea
                required
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all resize-none h-24"
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-dark-border flex justify-end gap-3 bg-slate-50 dark:bg-dark-surface/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-walk-form"
            disabled={loading}
            className="btn-primary px-8 py-2.5 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditWalkModal
