import { useState } from 'react'
import { X, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { parseApiResponse } from '../utils/imageCompressor'

interface RegisterWalkModalProps {
  walkId: string
  walkTitle: string
  availableSlots: number
  onClose: () => void
  onSuccess: () => void
}

const RegisterWalkModal = ({ walkId, walkTitle, availableSlots, onClose, onSuccess }: RegisterWalkModalProps) => {
  const { user } = useAuth()
  const [slots, setSlots] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxSelectable = Math.min(3, Math.max(1, availableSlots))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (slots < 1 || slots > availableSlots) {
      setError(`Please select between 1 and ${availableSlots} slots.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        walkId,
        slots,
        userId: user?.uid
      }
      const token = await user?.getIdToken()
      if (!token) throw new Error('Please login to register for walks')

      const response = await fetch('/api/Walk/registerWalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await parseApiResponse(response)
      if (data && data.success) {
        onSuccess()
      } else {
        setError(data?.error ? String(data.error) : 'Failed to complete registration')
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Register for Walk</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{walkTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-xl text-sm leading-relaxed border border-primary-100 dark:border-primary-900/30">
            Select how many spots you would like to reserve below.
          </div>

          <form id="register-walk-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" /> Number of Participants
              </label>
              <select
                value={slots}
                onChange={(e) => setSlots(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all text-base"
              >
                {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Person' : 'People'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {availableSlots} slot{availableSlots === 1 ? '' : 's'} remaining
              </p>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="register-walk-form"
            disabled={loading}
            className="btn-primary px-8 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Registering...
              </>
            ) : (
              <>
                Confirm Registration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegisterWalkModal
