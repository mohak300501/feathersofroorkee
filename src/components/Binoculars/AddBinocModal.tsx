import { FormEvent, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
  onAdd: (make: string, physicalId: string) => Promise<void>
}

const AddBinocModal = ({ onClose, onAdd }: Props) => {
  const [make, setMake] = useState('')
  const [physicalId, setPhysicalId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!make.trim() || !physicalId.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    setSaving(true)
    try {
      await onAdd(make.trim(), physicalId.trim())
    } catch (error: any) {
      toast.error(error.message || 'Failed to add binocular')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-md p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add a Binocular</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" disabled={saving}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Make *</label>
            <input
              value={make}
              onChange={e => setMake(e.target.value)}
              className="input-field"
              placeholder="e.g. Nikon"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Physical ID *</label>
            <input
              value={physicalId}
              onChange={e => setPhysicalId(e.target.value)}
              className="input-field"
              placeholder="e.g. BINOC-001"
              required
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The server will generate an encrypted QR payload after saving.
          </p>
          <div className="flex gap-3 pt-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Adding...' : 'Add Binocular'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBinocModal
