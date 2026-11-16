import { useState } from 'react'
import { X } from 'lucide-react'

interface EditWalkPhotoModalProps {
  initialInfo: string
  onClose: () => void
  onSave: (info: string) => Promise<void>
}

const EditWalkPhotoModal = ({ initialInfo, onClose, onSave }: EditWalkPhotoModalProps) => {
  const [info, setInfo] = useState(initialInfo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSave(info.trim())
      onClose()
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update photo info.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Photo Info</h2>
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
          <label htmlFor="walk-photo-info" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Photo info
          </label>
          <textarea
            id="walk-photo-info"
            value={info}
            onChange={(event) => setInfo(event.target.value)}
            maxLength={2000}
            className="input-field resize-y min-h-32"
            placeholder="Share a few words about this memory..."
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary px-6">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditWalkPhotoModal
