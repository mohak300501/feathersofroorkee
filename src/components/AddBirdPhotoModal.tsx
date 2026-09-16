import React, { useState } from 'react'
import { X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { SightingFields } from './AddBirdSightingModal'
import type { SightingFormData } from '../interfaces/BirdSighting'

// Upload Modal Component
interface AddBirdPhotoModalProps {
  onClose: () => void
  onUpload: (formData: FormData) => Promise<void>
  uploading: boolean
}

const AddBirdPhotoModal = ({ onClose, onUpload, uploading }: AddBirdPhotoModalProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [sighting, setSighting] = useState<SightingFormData>({
    location: '',
    mapCoords: null,
    info: '',
    dateOfSighting: '',
    timeOfSighting: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !sighting.location || !sighting.mapCoords || !sighting.dateOfSighting || !sighting.timeOfSighting) {
      toast.error('Please fill in all fields')
      return
    }
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('location', sighting.location)
    formData.append('mapCoords', JSON.stringify(sighting.mapCoords))
    formData.append('info', sighting.info)
    formData.append('datetimeOfSighting', `${sighting.dateOfSighting}T${sighting.timeOfSighting}:00`)
    await onUpload(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Upload Photo</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50 transition-colors"
              required
            />
          </div>

          <SightingFields value={sighting} onChange={setSighting} />

          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary flex-1 flex justify-center items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBirdPhotoModal;
