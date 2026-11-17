import { useRef, useState } from 'react'
import { X } from 'lucide-react'

interface WalkExperienceModalProps {
  title: string
  initialInfo?: string
  submitLabel: string
  onClose: () => void
  onSubmit: (info: string) => Promise<void>
}

const WalkExperienceModal = ({
  title,
  initialInfo = '',
  submitLabel,
  onClose,
  onSubmit
}: WalkExperienceModalProps) => {
  const [info, setInfo] = useState(initialInfo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submissionInProgress = useRef(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submissionInProgress.current) return
    const trimmedInfo = info.trim()
    if (!trimmedInfo) {
      setError('Please write an experience before submitting.')
      return
    }

    submissionInProgress.current = true
    setLoading(true)
    setError('')
    try {
      await onSubmit(trimmedInfo)
      onClose()
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save experience.')
    } finally {
      submissionInProgress.current = false
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
          <label htmlFor="walk-info" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tell us about your experience
          </label>
          <textarea
            id="walk-info"
            value={info}
            onChange={(event) => setInfo(event.target.value)}
            maxLength={2000}
            required
            autoFocus
            className="input-field resize-y min-h-32"
            placeholder="Share a reflection from this birdwalk..."
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary px-6">
              {loading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WalkExperienceModal
