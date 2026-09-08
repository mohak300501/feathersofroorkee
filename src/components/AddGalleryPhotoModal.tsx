import { useState, useRef } from 'react'
import { X, Upload, MessageSquare, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AddGalleryPhotoModalProps {
  workshopId: string
  onClose: () => void
  onSuccess: () => void
}

const AddGalleryPhotoModal = ({ workshopId, onClose, onSuccess }: AddGalleryPhotoModalProps) => {
  const { user } = useAuth()
  const [experience, setExperience] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please upload a photo to share.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1]

        const payload = {
          workshopId,
          experience,
          fileData: base64Data,
          fileName: file.name,
          contentType: file.type,
          userId: user?.uid
        }

        const response = await fetch('/api/Workshop/addGalleryPhoto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await response.json()
        if (response.ok && data.success) {
          onSuccess()
        } else {
          setError(data.error || 'Failed to add photo')
        }
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred.')
    } finally {
      if(error) setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Share Your Experience</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <form id="add-gallery-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Photo</label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${previewUrl ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-md">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium flex items-center gap-2"><Upload className="w-5 h-5"/>Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-500 dark:text-slate-400">
                    <ImageIcon className="w-12 h-12 mb-3 text-slate-400 dark:text-slate-500" />
                    <p className="font-medium">Click to upload photo</p>
                    <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4"/> Share a few words about this memory
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="input-field resize-none h-32"
                placeholder="Had a great time spotting birds..."
              />
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
            form="add-gallery-form"
            disabled={loading}
            className="btn-primary px-8 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              'Share Photo'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddGalleryPhotoModal
