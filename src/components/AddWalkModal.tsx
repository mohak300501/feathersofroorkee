import { useState, useRef } from 'react'
import { X, Upload, Calendar, MapPin, AlignLeft, Users, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { compressImage, readFileAsBase64, parseApiResponse, isSizeLimitError } from '../utils/imageCompressor'
import toast from 'react-hot-toast'

interface AddWalkModalProps {
  onClose: () => void
  onSuccess: () => void
}

const AddWalkModal = ({ onClose, onSuccess }: AddWalkModalProps) => {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [info, setInfo] = useState('')
  const [datetime, setDatetime] = useState('')
  const [location, setLocation] = useState('')
  const [mapPin, setMapPin] = useState('')
  const [limit, setLimit] = useState<number>(25)
  const [compress, setCompress] = useState(false)
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
    if (!title || !info || !datetime || !location || !file) {
      setError('Please fill all required fields and upload a poster.')
      return
    }

    if (limit < 1) {
      setError('Participant limit must be at least 1.')
      return
    }

    setLoading(true)
    setError('')

    try {
      let fileData = ''
      let fileName = file.name
      let contentType = file.type || 'image/jpeg'

      if (compress) {
        const compressed = await compressImage(file, { maxWidth: 2048, maxHeight: 2048, quality: 0.85 })
        fileData = compressed.fileData
        fileName = compressed.fileName
        contentType = compressed.contentType
      } else {
        fileData = await readFileAsBase64(file)
      }

      const payload = {
        title,
        info,
        datetime,
        location,
        mapPin,
        limit: Number(limit),
        fileData,
        fileName,
        contentType,
        userId: user?.uid
      }

      const response = await fetch('/api/Walk/addWalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await parseApiResponse(response)
      if (data && data.success) {
        onSuccess()
      } else {
        setError(data?.error ? data.error.message : 'Failed to create walk')
      }
    } catch (err: unknown) {
      console.error(err)
      if (isSizeLimitError(err)) {
        const msg = 'Upload failed: poster image size is too large. Please toggle "Compress poster image" on and try again.'
        setError(msg)
        toast.error(msg, { duration: 7000 })
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-dark-border">
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Create New Walk</h2>
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

          <form id="add-walk-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Walk Poster</label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${previewUrl ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-dark-border'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium flex items-center gap-2"><Upload className="w-5 h-5"/> Change Poster</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-500 dark:text-slate-400">
                    <ImageIcon className="w-12 h-12 mb-3 text-slate-400" />
                    <p className="font-medium">Click to upload poster</p>
                    <p className="text-xs mt-1 text-slate-400">PNG, JPG up to 10MB</p>
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

            {/* Compression Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div>
                <label htmlFor="poster-compress-toggle" className="text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                  Compress poster image before upload
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enable if you get a size limit error.
                </p>
              </div>
              <input
                id="poster-compress-toggle"
                type="checkbox"
                checked={compress}
                onChange={(e) => setCompress(e.target.checked)}
                className="w-5 h-5 accent-primary-600 rounded cursor-pointer shrink-0 ml-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <AlignLeft className="w-4 h-4"/> Walk Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                  placeholder="e.g., Winter Birding Walk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <AlignLeft className="w-4 h-4"/> Walk Description
                </label>
                <textarea
                  required
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all resize-none h-24"
                  placeholder="Tell us more about what we will do..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4"/> Date and Time
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
                  <MapPin className="w-4 h-4"/> Location Name
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                  placeholder="e.g., Samudra Township"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400"/> Google Maps Link (Optional)
                </label>
                <input
                  type="url"
                  value={mapPin}
                  onChange={(e) => setMapPin(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-500"/> Participant Limit
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
            form="add-walk-form"
            disabled={loading}
            className="btn-primary px-8 py-2.5 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Create Walk'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddWalkModal
