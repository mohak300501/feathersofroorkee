import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { BirdData } from '../interfaces/BirdData'
import type { BirdPhoto } from '../interfaces/BirdPhoto'
import type { BirdSighting, SightingFormData } from '../interfaces/BirdSighting'
import BirdPhotos from '../components/BirdPhotos'
import BirdSightings from '../components/BirdSightings'
import BirdSightingsMap from '../components/BirdSightingsMap'
import LoadingSpinner from '../components/LoadingSpinner'
import { Bird, Camera, Eye, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { IUCN_STATUS_MAP } from '../utils/iucn_map'
import toast from 'react-hot-toast'
import EditBirdModal from '../components/EditBirdModal'
import SwitchSpeciesModal from '../components/SwitchSpeciesModal'
import EditBirdPhotoModal from '../components/EditBirdPhotoModal'
import EditBirdSightingModal from '../components/EditBirdSightingModal'
import AddBirdPhotoModal from '../components/AddBirdPhotoModal'
import AddBirdSightingModal from '../components/AddBirdSightingModal'
import { FamilyData } from '../components/AddBirdModal'

const BirdDetail = () => {
  const { commonCode } = useParams<{ commonCode: string }>()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [bird, setBird] = useState<BirdData | null>(null)
  const [photos, setPhotos] = useState<BirdPhoto[]>([])
  const [sightings, setSightings] = useState<BirdSighting[]>([])
  const [selectedSightingId, setSelectedSightingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'photos' | 'sightings'>('photos')
  const [addingPhotoModal, setAddingPhotoModal] = useState(false)
  const [addingSightingModal, setAddingSightingModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<BirdPhoto | null>(null)
  const [editingSighting, setEditingSighting] = useState<BirdSighting | null>(null)
  const [switchingPhoto, setSwitchingPhoto] = useState<BirdPhoto | null>(null)
  const [families, setFamilies] = useState<FamilyData[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editing, setEditing] = useState(false)

  const fetchBirdData = async () => {
    if (!commonCode) return
    try {
      const token = user ? await user.getIdToken() : null
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch(`/api/Bird/getBird?commonCode=${commonCode}`, { headers })
      if (!response.ok) {
        toast.error('Bird not found')
        return
      }
      const data = await response.json()
      setBird(data.bird)
      setPhotos((data.photos || []).map((p: any) => ({ ...p, hearts: p.hearts ?? 0 })))
      setSightings((data.sightings || []).map((s: any) => ({
        ...s,
        sightingId: s.sightingId || s.id,
        mapCoords: [Number(s.mapCoords?.[0]), Number(s.mapCoords?.[1])],
        datetimeOfSighting: new Date(s.datetimeOfSighting),
        addedAt: new Date(s.addedAt),
      })))
    } catch (error) {
      console.error('Error fetching bird data:', error)
      toast.error('Failed to load bird data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBirdData()
    const fetchFamilies = async () => {
      if (!isAdmin) return
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
    fetchFamilies()
  }, [commonCode, isAdmin, user])

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
      const data = await response.json()
      if (data.commonCode && data.commonCode !== commonCode) navigate(`/bird/${data.commonCode}`)
      else window.location.reload()
    } catch (error: any) {
      console.error('Error editing bird:', error)
      toast.error(error.message || 'Failed to edit bird')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteBird = async () => {
    if (!bird) return
    if (!window.confirm(`Are you sure you want to delete "${bird.commonName}"? This will also delete all associated photos.`)) return
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
      const response = await fetch('/api/Bird/deleteBirdPhoto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birdId: bird?.id, photoId, userId: user?.uid }),
      })
      if (!response.ok) throw new Error('Failed to delete photo')
      setPhotos(prev => prev.filter(photo => photo.id !== photoId))
      setSightings(prev => prev.filter(sighting => sighting.photoId !== photoId))
      setBird(prev => prev ? { ...prev, photoCount: prev.photoCount - 1 } : null)
    } catch (error) {
      console.error('Error deleting photo:', error)
      throw error
    }
  }

  const handleSetFeatured = async (fileId: string) => {
    try {
      const response = await fetch('/api/Bird/setFeaturedPhoto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birdId: bird?.id, fileId, userId: user?.uid }),
      })
      if (!response.ok) throw new Error('Failed to set featured photo')
      toast.success('Featured photo updated successfully!')
    } catch (error) {
      console.error('Error setting featured photo:', error)
      toast.error('Failed to set featured photo')
      throw error
    }
  }

  const handleEditPhotoSubmit = async (photoId: string, data: SightingFormData) => {
    try {
      const datetimeOfSighting = `${data.dateOfSighting}T${data.timeOfSighting}:00`
      const response = await fetch('/api/Bird/editBirdPhoto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userId: user?.uid, mapCoords: data.mapCoords, location: data.location, info: data.info, datetimeOfSighting }),
      })
      if (!response.ok) throw new Error('Failed to update photo')
      setSightings(prev => prev.map(s => s.photoId === photoId ? {
        ...s,
        location: data.location,
        mapCoords: data.mapCoords as [number, number],
        info: data.info,
        datetimeOfSighting: new Date(datetimeOfSighting),
      } : s))
      toast.success('Photo info updated successfully')
    } catch (error) {
      console.error('Error updating photo:', error)
      toast.error('Failed to update photo')
      throw error
    }
  }

  const handleEditSightingSubmit = async (sightingId: string, data: SightingFormData) => {
    try {
      const datetimeOfSighting = `${data.dateOfSighting}T${data.timeOfSighting}:00`
      const response = await fetch('/api/Bird/editBirdSighting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sightingId, userId: user?.uid, mapCoords: data.mapCoords, location: data.location, info: data.info, datetimeOfSighting }),
      })
      if (!response.ok) throw new Error('Failed to update sighting')
      setSightings(prev => prev.map(s => s.sightingId === sightingId ? {
        ...s,
        location: data.location,
        mapCoords: data.mapCoords as [number, number],
        info: data.info,
        datetimeOfSighting: new Date(datetimeOfSighting),
      } : s))
      toast.success('Sighting info updated successfully')
    } catch (error) {
      console.error('Error updating sighting:', error)
      toast.error('Failed to update sighting')
      throw error
    }
  }

  const handleDeleteSighting = async (sightingId: string) => {
    if (!window.confirm('Are you sure you want to delete this sighting?')) return
    try {
      const response = await fetch('/api/Bird/deleteBirdSighting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sightingId, userId: user?.uid }),
      })
      if (!response.ok) throw new Error('Failed to delete sighting')
      setSightings(prev => prev.filter(s => s.sightingId !== sightingId))
      toast.success('Sighting deleted successfully')
    } catch (error) {
      console.error('Error deleting sighting:', error)
      toast.error('Failed to delete sighting')
    }
  }

  const handleSwitchSpeciesSubmit = async (photoId: string, newBirdId: string) => {
    try {
      const response = await fetch('/api/Bird/switchPhotoSpecies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userId: user?.uid, oldBirdId: bird?.id, newBirdId }),
      })
      if (!response.ok) throw new Error('Failed to switch species')
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      setSightings(prev => prev.filter(s => s.photoId !== photoId))
      setBird(prev => prev ? { ...prev, photoCount: prev.photoCount - 1 } : null)
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
      const mapCoords = JSON.parse(formData.get('mapCoords') as string) as [number, number]
      const info = formData.get('info') as string
      const datetimeOfSighting = formData.get('datetimeOfSighting') as string
      if (!file || !location || !mapCoords || !datetimeOfSighting) throw new Error('Missing required fields')

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/Bird/addBirdPhoto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64Data, fileName: file.name, contentType: file.type, birdId: bird.id, userId: user.uid, location, mapCoords, info, datetimeOfSighting }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }
      await fetchBirdData()
      setAddingPhotoModal(false)
      toast.success('Photo uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleAddSighting = async (data: SightingFormData) => {
    if (!user || !bird || !data.mapCoords) return
    const datetimeOfSighting = `${data.dateOfSighting}T${data.timeOfSighting}:00`
    try {
      const response = await fetch('/api/Bird/addBirdSighting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birdId: bird.id,
          userId: user.uid,
          photoId: '',
          mapCoords: data.mapCoords,
          location: data.location,
          info: data.info,
          datetimeOfSighting
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add sighting')
      }
      const result = await response.json()
      setSightings(prev => [{
        id: result.sightingId,
        sightingId: result.sightingId,
        birdId: bird.id,
        photoId: '',
        userId: user.uid,
        username: result.username,
        mapCoords: data.mapCoords as [number, number],
        location: data.location,
        info: data.info,
        datetimeOfSighting: new Date(datetimeOfSighting),
        addedAt: new Date(),
      }, ...prev])
      setAddingSightingModal(false)
      toast.success('Sighting added successfully!')
    } catch (error: any) {
      console.error('Error adding sighting:', error)
      toast.error(error.message || 'Failed to add sighting')
    }
  }

  const handleHeart = async (photoId: string) => {
    if (!user) return 0
    const token = await user.getIdToken();
    const response = await fetch('/api/Bird/heartBirdPhoto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ photoId }),
    })
    if (!response.ok) throw new Error('Failed to toggle heart')
    const result = await response.json()
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, hearts: result.hearts, hasHearted: result.hasHearted } : p))
    return result.hearts as number
  }

  if (loading) return <LoadingSpinner />
  if (!bird) {
    return (
      <div className="glass-card text-center py-16 max-w-lg mx-auto mt-12 animate-fade-in">
        <div className="p-4 bg-slate-100 dark:bg-dark-surface rounded-full inline-block mb-6">
          <Bird className="h-16 w-16 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Bird not found</h3>
        <p className="text-slate-500 dark:text-slate-400 text-lg">The bird you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-fade-in relative z-10 py-6">
      <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-slate-500 hover:text-primary-600 transition-colors mb-4"><ArrowLeft className="w-4 h-4" /><span>Back to Home</span></button>

      <div className="text-center space-y-4 glass rounded-3xl p-10 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-bird-400/10 dark:from-primary-900/20 dark:to-bird-900/20 pointer-events-none" />
        <h1 className="font-display text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-bird-500 dark:from-primary-400 dark:to-bird-400 relative z-10">{bird.commonName}</h1>
        <p className="text-2xl text-slate-600 dark:text-slate-400 italic relative z-10 font-light">{bird.scientificName}</p>
        <div className="flex flex-wrap items-center justify-center pt-6 gap-4 relative z-10">
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 font-medium shadow-inner border border-slate-200 dark:border-slate-700">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${IUCN_STATUS_MAP[bird.iucnStatus] ? IUCN_STATUS_MAP[bird.iucnStatus].color : 'bg-slate-200 dark:bg-slate-700 text-black'}`}>{bird.iucnStatus}</span>
            <span className="text-sm">{IUCN_STATUS_MAP[bird.iucnStatus] ? IUCN_STATUS_MAP[bird.iucnStatus].label : 'IUCN'}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 font-medium shadow-inner border border-slate-200 dark:border-slate-700">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${bird.isMigratory ? 'bg-pink-500' : 'bg-blue-500'}`}>{bird.isMigratory ? 'M' : 'R'}</span>
            <span className="text-sm">{bird.isMigratory ? 'Migratory' : 'Resident'}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-full text-slate-700 dark:text-slate-300 font-medium shadow-inner border border-slate-200 dark:border-slate-700">
            <Camera className="h-5 w-5 text-primary-500" />
            <span>{bird.photoCount} photo{bird.photoCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {bird.info && <div className="glass-card p-8 text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium max-w-4xl mx-auto"><p className="whitespace-pre-wrap">{bird.info}</p></div>}

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

      <section className="max-w-6xl mx-auto space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Bird Sightings Map</h2>
          <div className="flex justify-center flex-wrap gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />No photo
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-600" />With photo
            </span>
          </div>
        </div>
        <BirdSightingsMap
          sightings={sightings}
          selectedSightingId={selectedSightingId}
          onSelect={setSelectedSightingId}
        />
      </section>

      <section className="max-w-6xl mx-auto">
        <div className="flex max-w-sm h-12 rounded-xl overflow-hidden shadow-lg mb-8 mx-auto">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 flex items-center justify-center space-x-2 px-5 py-3 text-sm font-medium transition-all
              ${activeTab === 'photos' ?
                'text-white bg-gradient-to-r from-primary-600 to-primary-500' :
                'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-blue-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <Camera className="h-5 w-5" /> <span>Photos</span>
          </button>
          <button
            onClick={() => setActiveTab('sightings')}
            className={`flex-1 flex items-center justify-center space-x-2 px-5 py-3 text-sm font-medium transition-all
              ${activeTab === 'sightings' ?
                'text-white bg-gradient-to-r from-primary-600 to-primary-500' :
                'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-blue-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <Eye className="h-5 w-5" /> <span>Sightings</span>
          </button>
        </div>

        {activeTab === 'photos' ? (
          <BirdPhotos
            photos={photos}
            sightings={sightings}
            user={user}
            onAddPhoto={() => setAddingPhotoModal(true)}
            onDelete={handlePhotoDelete}
            onSetFeatured={handleSetFeatured}
            onEditInfo={(id) => {
              const photo = photos.find(p => p.id === id)
              if (!photo) return
              const sighting = sightings.find(s => s.photoId === id)
              setEditingPhoto({ ...photo, sighting: sighting as any })
            }}
            onSwitchSpecies={(id) => setSwitchingPhoto(photos.find(p => p.id === id) || null)}
            onCoordinateClick={setSelectedSightingId}
            onHeart={handleHeart}
          />
        ) : (
          <BirdSightings
            sightings={sightings}
            user={user}
            isAdmin={isAdmin}
            onAddSighting={() => setAddingSightingModal(true)}
            onCoordinateClick={setSelectedSightingId}
            onEditSighting={(id) => setEditingSighting(sightings.find(s => s.sightingId === id) || null)}
            onDeleteSighting={handleDeleteSighting}
          />
        )}
      </section>

      {addingPhotoModal &&
        <AddBirdPhotoModal
          onClose={() => setAddingPhotoModal(false)}
          onUpload={handlePhotoUpload}
          uploading={uploading}
        />}
      {addingSightingModal &&
        <AddBirdSightingModal
          onClose={() => setAddingSightingModal(false)}
          onAdd={handleAddSighting}
        />}
      {editingPhoto &&
        <EditBirdPhotoModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onUpdate={handleEditPhotoSubmit}
        />}
      {editingSighting &&
        <EditBirdSightingModal
          sighting={editingSighting}
          onClose={() => setEditingSighting(null)}
          onUpdate={handleEditSightingSubmit}
        />}
      {switchingPhoto &&
        <SwitchSpeciesModal
          photo={switchingPhoto as any}
          onClose={() => setSwitchingPhoto(null)}
          onSwitch={handleSwitchSpeciesSubmit}
        />}
      {showEditModal &&
        <EditBirdModal
          bird={bird as any}
          families={families}
          onClose={() => setShowEditModal(false)}
          onEdit={handleEditBird}
          editing={editing}
        />}
    </div>
  )
}

export default BirdDetail
