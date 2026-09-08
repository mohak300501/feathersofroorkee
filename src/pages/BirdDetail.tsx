import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PhotoCard from '../components/PhotoCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Bird, Camera, MapPin, Calendar, Upload, X, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { IUCN_STATUS_MAP } from '../utils/iucn_map'
import toast from 'react-hot-toast'
import EditBirdModal from '../components/EditBirdModal'
import { FamilyData } from '../components/AddBirdModal'

interface BirdData {
  id: string
  commonName: string
  scientificName: string
  photoCount: number
  iucnStatus: string
  isMigratory: boolean
  familyId?: string
  familyName?: string
  info?: string
}

interface Photo {
  id: string
  location: string
  dateOfCapture: Date
  imagekitFilePath: string
  imagekitFileId: string
  driveFileId: string
  userId: string
  username: string
}

const BirdDetail = () => {
  const { commonCode } = useParams<{ commonCode: string }>()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [bird, setBird] = useState<BirdData | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [switchingPhoto, setSwitchingPhoto] = useState<Photo | null>(null)
  const [families, setFamilies] = useState<FamilyData[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const fetchBirdData = async () => {
      if (!commonCode) return

      try {
        const response = await fetch(`/api/Bird/getBird?commonCode=${commonCode}`)

        if (response.status === 404) {
          // Fallback to fetch by ID if commonCode fails
          const idResponse = await fetch(`/api/Bird/getBird?id=${commonCode}`)
          if (idResponse.ok) {
            const data = await idResponse.json()
            setBird(data.bird)
            setPhotos(data.photos.map((p: any) => ({ ...p, dateOfCapture: new Date(p.dateOfCapture) })))
          } else {
            toast.error('Bird not found')
          }
          return
        }

        if (response.ok) {
          const data = await response.json()
          setBird(data.bird)
          setPhotos(data.photos.map((p: any) => ({ ...p, dateOfCapture: new Date(p.dateOfCapture) })))
        } else {
          toast.error('Bird not found')
        }
      } catch (error) {
        console.error('Error fetching bird data:', error)
        toast.error('Failed to load bird data')
      } finally {
        setLoading(false)
      }
    }

    const fetchFamilies = async () => {
      if (isAdmin) {
        try {
          const response = await fetch('/api/Bird/getFamilies')
          if (response.ok) {
            const data = await response.json()
            if (data.success) setFamilies(data.families)
          }
        } catch (error) {
          console.error('Error fetching families:', error)
        }
      }
    }

    fetchBirdData()
    fetchFamilies()
  }, [commonCode, isAdmin])

  const handleEditBird = async (birdId: string, commonName: string, scientificName: string, familyId: string, iucnStatus: string, isMigratory: boolean, info: string) => {
    setEditing(true)
    try {
      const response = await fetch('/api/Bird/editBird', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birdId, commonName, scientificName, familyId, userId: user?.uid, iucnStatus, isMigratory, info }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to edit bird')
      }
      toast.success('Bird updated successfully!')
      setShowEditModal(false)
      const data = await response.json();
      if (data.commonCode && data.commonCode !== commonCode) {
        navigate(`/bird/${data.commonCode}`);
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error editing bird:', error)
      toast.error(error.message || 'Failed to edit bird')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteBird = async () => {
    if (!bird) return;
    if (!window.confirm(`Are you sure you want to delete "${bird.commonName}"? This will also delete all associated photos.`)) return;
    try {
      const response = await fetch('/api/Bird/deleteBird', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birdId: bird.id, userId: user?.uid }),
      })
      if (!response.ok) throw new Error('Failed to delete bird')
      toast.success('Bird deleted successfully!')
      navigate('/')
    } catch (error: any) {
      console.error('Error deleting bird:', error)
      toast.error('Failed to delete bird')
    }
  }

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const response = await fetch('/api/Bird/deletePhoto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birdId: bird?.id,
          photoId: photoId,
          userId: user?.uid
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete photo')
      }

      setPhotos(photos.filter(photo => photo.id !== photoId))

      if (bird) {
        setBird(prev => prev ? { ...prev, photoCount: prev.photoCount - 1 } : null)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      throw error
    }
  }

  const handleSetFeatured = async (fileId: string) => {
    try {
      const response = await fetch('/api/Bird/setFeaturedPhoto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birdId: bird?.id,
          fileId: fileId,
          userId: user?.uid
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to set featured photo')
      }

      toast.success('Featured photo updated successfully!')
    } catch (error) {
      console.error('Error setting featured photo:', error)
      toast.error('Failed to set featured photo')
      throw error
    }
  }

  const handleEditPhotoSubmit = async (photoId: string, location: string, dateOfCapture: string) => {
    try {
      const response = await fetch('/api/Bird/editPhotoInfo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userId: user?.uid, location, dateOfCapture })
      })
      if (!response.ok) throw new Error('Failed to update photo')

      setPhotos(photos.map(p => p.id === photoId ? { ...p, location, dateOfCapture: new Date(dateOfCapture) } : p))
      toast.success('Photo info updated successfully')
    } catch (error) {
      console.error('Error updating photo:', error)
      toast.error('Failed to update photo')
    }
  }

  const handleSwitchSpeciesSubmit = async (photoId: string, newBirdId: string) => {
    try {
      const response = await fetch('/api/Bird/switchPhotoSpecies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userId: user?.uid, oldBirdId: bird?.id, newBirdId })
      })
      if (!response.ok) throw new Error('Failed to switch species')

      setPhotos(photos.filter(p => p.id !== photoId))
      if (bird) {
        setBird(prev => prev ? { ...prev, photoCount: prev.photoCount - 1 } : null)
      }
      toast.success('Photo moved to new species successfully')
    } catch (error) {
      console.error('Error switching species:', error)
      toast.error('Failed to move photo')
    }
  }

  const handlePhotoUpload = async (formData: FormData) => {
    if (!user || !bird) return

    setUploading(true)
    try {
      const file = formData.get('photo') as File
      const location = formData.get('location') as string
      const dateOfCapture = formData.get('dateOfCapture') as string

      if (!file || !location || !dateOfCapture) {
        throw new Error('Missing required fields')
      }

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/Bird/addBirdPhoto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          contentType: file.type,
          birdId: bird.id,
          userId: user.uid,
          location,
          dateOfCapture,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }

      const result = await response.json()

      const newPhoto: Photo = {
        id: result.photoId,
        location: result.location,
        dateOfCapture: new Date(result.dateOfCapture),
        imagekitFilePath: result.imagekitFilePath,
        imagekitFileId: result.imagekitFileId,
        driveFileId: result.driveFileId,
        userId: user.uid,
        username: result.username
      }

      setPhotos([newPhoto, ...photos])

      if (bird) {
        setBird(prev => prev ? { ...prev, photoCount: prev.photoCount + 1 } : null)
      }

      setShowUploadModal(false)
      toast.success('Photo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!bird) {
    return (
      <div className="glass-card text-center py-16 max-w-lg mx-auto mt-12 animate-fade-in">
        <div className="p-4 bg-slate-100 dark:bg-dark-surface rounded-full inline-block mb-6 shadow-inner">
          <Bird className="h-16 w-16 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Bird not found</h3>
        <p className="text-slate-500 dark:text-slate-400 text-lg">The bird you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-fade-in relative z-10 py-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-slate-500 hover:text-primary-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Bird Header */}
      <div className="text-center space-y-4 glass rounded-3xl p-10 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-bird-400/10 dark:from-primary-900/20 dark:to-bird-900/20 pointer-events-none"></div>
        <h1 className="font-display text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-bird-500 dark:from-primary-400 dark:to-bird-400 relative z-10">{bird.commonName}</h1>
        <p className="text-2xl text-slate-600 dark:text-slate-400 italic relative z-10 font-light">{bird.scientificName}</p>
        <div className="flex flex-wrap items-center justify-center pt-6 gap-4 relative z-10">
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 font-medium shadow-inner border border-slate-200 dark:border-slate-700">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${IUCN_STATUS_MAP[bird.iucnStatus] ? IUCN_STATUS_MAP[bird.iucnStatus].color : 'bg-slate-200 dark:bg-slate-700 text-black text-opacity-80 dark:text-slate-200 border border-slate-300 dark:border-slate-600'}`}>
              {bird.iucnStatus}
            </span>
            <span className="text-sm">{IUCN_STATUS_MAP[bird.iucnStatus] ? IUCN_STATUS_MAP[bird.iucnStatus].label : 'IUCN'}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 font-medium shadow-inner border border-slate-200 dark:border-slate-700">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${bird.isMigratory ? 'bg-pink-500 shadow-pink-500/30' : 'bg-blue-500 shadow-blue-500/30'}`}>
              {bird.isMigratory ? 'M' : 'R'}
            </span>
            <span className="text-sm">{bird.isMigratory ? 'Migratory' : 'Resident'}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-full text-slate-700 dark:text-slate-300 font-medium shadow-inner">
            <Camera className="h-5 w-5 text-primary-500" />
            <span>{bird.photoCount} photo{bird.photoCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      {bird.info && (
        <div className="glass-card p-8 text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium max-w-4xl mx-auto">
          <p className="whitespace-pre-wrap">{bird.info}</p>
        </div>
      )}

      {/* Admin Controls */}
      {user && isAdmin && (
        <div className="flex justify-center gap-4 max-w-4xl mx-auto">
          <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>Edit Bird</span>
          </button>
          <button onClick={handleDeleteBird} className="btn-secondary text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2">
            <Trash2 className="w-5 h-5" />
            <span>Delete Bird</span>
          </button>
        </div>
      )}

      {/* Upload Button */}
      {user && (
        <div className="text-center">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center space-x-2 text-lg shadow-xl hover:-translate-y-1"
          >
            <Upload className="h-6 w-6" />
            <span>Add Photo</span>
          </button>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length === 0 ? (
        <div className="glass-card text-center py-16 max-w-lg mx-auto">
          <div className="p-4 bg-slate-100 dark:bg-dark-surface rounded-full inline-block mb-6 shadow-inner">
            <Camera className="h-16 w-16 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No photos yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {user ? 'Be the first to add a photo of this bird!' : 'Sign in to add photos of this bird.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              id={photo.id}
              imagekitFilePath={photo.imagekitFilePath}
              driveFileId={photo.driveFileId}
              location={photo.location}
              dateOfCapture={photo.dateOfCapture}
              userId={photo.userId}
              username={photo.username}
              onDelete={handlePhotoDelete}
              onSetFeatured={handleSetFeatured}
              onEditInfo={(id) => setEditingPhoto(photos.find(p => p.id === id) || null)}
              onSwitchSpecies={(id) => setSwitchingPhoto(photos.find(p => p.id === id) || null)}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handlePhotoUpload}
          uploading={uploading}
        />
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <EditPhotoModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onUpdate={handleEditPhotoSubmit}
        />
      )}

      {/* Switch Species Modal */}
      {switchingPhoto && (
        <SwitchSpeciesModal
          photo={switchingPhoto}
          onClose={() => setSwitchingPhoto(null)}
          onSwitch={handleSwitchSpeciesSubmit}
        />
      )}

      {/* Edit Bird Modal */}
      {showEditModal && bird && (
        <EditBirdModal
          bird={bird as any}
          families={families}
          onClose={() => setShowEditModal(false)}
          onEdit={handleEditBird}
          editing={editing}
        />
      )}
    </div>
  )
}

// Upload Modal Component
interface UploadModalProps {
  onClose: () => void
  onUpload: (formData: FormData) => Promise<void>
  uploading: boolean
}

const UploadModal = ({ onClose, onUpload, uploading }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [location, setLocation] = useState('')
  const [dateOfCapture, setDateOfCapture] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !location || !dateOfCapture) {
      toast.error('Please fill in all fields')
      return
    }

    const formData = new FormData()
    formData.append('photo', file)
    formData.append('location', location)
    formData.append('dateOfCapture', dateOfCapture)

    await onUpload(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 h-5 w-5 transition-colors" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field pl-12"
                placeholder="Where was this photo taken?"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Date of Capture
            </label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 h-5 w-5 transition-colors" />
              <input
                type="date"
                value={dateOfCapture}
                onChange={(e) => setDateOfCapture(e.target.value)}
                className="input-field pl-12"
                required
              />
            </div>
          </div>

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

export default BirdDetail
interface EditPhotoModalProps {
  photo: Photo
  onClose: () => void
  onUpdate: (photoId: string, location: string, dateOfCapture: string) => Promise<void>
}

const EditPhotoModal = ({ photo, onClose, onUpdate }: EditPhotoModalProps) => {
  const [location, setLocation] = useState(photo.location)
  const [dateOfCapture, setDateOfCapture] = useState(photo.dateOfCapture.toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location || !dateOfCapture) {
      toast.error('Please fill in all fields')
      return
    }
    setSubmitting(true)
    try {
      await onUpdate(photo.id, location, dateOfCapture)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Edit Photo Info</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 h-5 w-5 transition-colors" />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field pl-12" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Capture</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 h-5 w-5 transition-colors" />
              <input type="date" value={dateOfCapture} onChange={(e) => setDateOfCapture(e.target.value)} className="input-field pl-12" required />
            </div>
          </div>
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

interface SwitchSpeciesModalProps {
  photo: Photo
  onClose: () => void
  onSwitch: (photoId: string, newBirdId: string) => Promise<void>
}

const SwitchSpeciesModal = ({ photo, onClose, onSwitch }: SwitchSpeciesModalProps) => {
  const [birds, setBirds] = useState<any[]>([])
  const [selectedBirdId, setSelectedBirdId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchBirds = async () => {
      try {
        const response = await fetch('/api/Bird/getBirds')
        if (response.ok) {
          const data = await response.json()
          setBirds(data.birds || [])
        }
      } catch (error) {
        toast.error('Failed to load species list')
      } finally {
        setLoading(false)
      }
    }
    fetchBirds()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBirdId) {
      toast.error('Please select a species')
      return
    }
    setSubmitting(true)
    try {
      await onSwitch(photo.id, selectedBirdId)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Switch Species</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Species</label>
              <div className="relative group">
                <Bird className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 h-5 w-5 transition-colors" />
                <select value={selectedBirdId} onChange={(e) => setSelectedBirdId(e.target.value)} className="input-field pl-12" required>
                  <option value="" disabled>Select a species...</option>
                  {birds.map(b => <option key={b.id} value={b.id}>{b.commonName} ({b.scientificName})</option>)}
                </select>
              </div>
            </div>
            <div className="flex space-x-4 pt-6">
              <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Switching...' : 'Switch Species'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
