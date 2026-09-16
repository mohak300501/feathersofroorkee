import React, { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { SightingFields } from './AddBirdSightingModal'
import type { BirdPhoto } from '../interfaces/BirdPhoto'
import type { SightingFormData } from '../interfaces/BirdSighting'

interface EditBirdPhotoModalProps {
  photo: BirdPhoto
  onClose: () => void
  onUpdate: (photoId: string, data: SightingFormData) => Promise<void>
}

const EditBirdPhotoModal = ({ photo, onClose, onUpdate }: EditBirdPhotoModalProps) => {
  const [value, setValue] = useState<SightingFormData>(() => {
    const sighting = photo.sighting
    const date = sighting ? new Date(sighting.datetimeOfSighting) : new Date()
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return {
      location: sighting?.location || '',
      mapCoords: sighting?.mapCoords || null,
      info: sighting?.info || '',
      dateOfSighting: sighting ? localDate.toISOString().split('T')[0] : '',
      timeOfSighting: sighting ? date.toTimeString().slice(0, 5) : '',
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.location || !value.dateOfSighting) {
      toast.error('Please fill in all fields')
      return
    }
    setSubmitting(true)
    try {
      await onUpdate(photo.id, value)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Edit Photo Info</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <SightingFields value={value} onChange={setValue} />
          <div className="flex space-x-4 pt-6">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBirdPhotoModal;
