import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { SightingFields } from './AddBirdSightingModal'
import type { BirdSighting, SightingFormData } from '../interfaces/BirdSighting'

interface EditBirdSightingModalProps {
  sighting: BirdSighting
  onClose: () => void
  onUpdate: (sightingId: string, data: SightingFormData) => Promise<void>
}

const EditBirdSightingModal = ({ sighting, onClose, onUpdate }: EditBirdSightingModalProps) => {
  const initial = useMemo<SightingFormData>(() => {
    const date = new Date(sighting.datetimeOfSighting)
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return {
      location: sighting.location,
      mapCoords: sighting.mapCoords,
      info: sighting.info || '',
      dateOfSighting: localDate.toISOString().split('T')[0],
      timeOfSighting: date.toTimeString().slice(0, 5),
    }
  }, [sighting])
  const [value, setValue] = useState(initial)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!value.location || !value.mapCoords || !value.dateOfSighting || !value.timeOfSighting) {
      toast.error('Please fill in location, coordinates, date and time')
      return
    }
    setSubmitting(true)
    try {
      await onUpdate(sighting.sightingId, value)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Edit Sighting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <SightingFields value={value} onChange={setValue} />
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBirdSightingModal
