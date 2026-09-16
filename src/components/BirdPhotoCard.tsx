import { useState } from 'react'
import { Calendar, MapPin, Pin, Heart, User, Trash2, Eye, Star, Edit3, ArrowRightLeft, X } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import type { BirdPhoto } from '../interfaces/BirdPhoto'

interface BirdPhotoCardProps extends BirdPhoto {
  onDelete: (photoId: string) => Promise<void>
  onSetFeatured: (fileId: string) => Promise<void>
  onEditInfo: (photoId: string) => void
  onSwitchSpecies: (photoId: string) => void
  onCoordinateClick?: (sightingId: string) => void
  onHeart?: (photoId: string) => Promise<number>
}

const BirdPhotoCard = ({
  id,
  imagekitFilePath,
  driveFileId,
  userId,
  username,
  hearts,
  hasHearted,
  sighting,
  onDelete,
  onSetFeatured,
  onEditInfo,
  onSwitchSpecies,
  onCoordinateClick,
  onHeart
}: BirdPhotoCardProps) => {
  const { user, isAdmin } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  const canEdit = isAdmin || (user && user.uid === userId)

  const handleDelete = async () => {
    if (!canEdit || !confirm('Are you sure you want to delete this photo?')) return

    setIsDeleting(true)
    try {
      await onDelete(id)
      toast.success('Photo deleted successfully')
    } catch (error) {
      toast.error('Failed to delete photo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetFeatured = async () => {
    const featureId = imagekitFilePath || driveFileId
    if (!isAdmin || !onSetFeatured || !featureId) return
    try {
      await onSetFeatured(featureId)
    } catch (error) {
      // Error handled by parent
    }
  }

  const handleHeart = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!user || !onHeart) return
    try {
      await onHeart(id)
    } catch {
      toast.error('Failed to toggle heart')
    }
  }

  const imgSrc = imagekitFilePath
    ? `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${imagekitFilePath}?tr=w-800,f-auto,q-auto`
    : `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w800`

  const fullImgSrc = imagekitFilePath
    ? `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${imagekitFilePath}?tr=w-1600,f-auto,q-auto`
    : `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`

  return (
    <>
      <div className="photo-card cursor-pointer" onClick={() => setShowFullImage(true)}>
        <div className="relative group">
          <img
            src={imgSrc}
            alt={`Bird photo taken at ${sighting?.location}`}
            className="w-full h-64 object-cover cursor-pointer"
            onClick={() => setShowFullImage(true)}

            onError={() => {
              console.error('Image failed to load:', imgSrc);
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={() => setShowFullImage(true)}
              className="opacity-0 group-hover:opacity-100 bg-white/90 p-2.5 rounded-full transition-all duration-300 hover:bg-white shadow-lg"
            >
              <Eye className="h-5 w-5 text-slate-700" />
            </button>
          </div>
          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {canEdit && onEditInfo && (
              <button
                onClick={() => onEditInfo(id)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                title="Edit Info"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            {canEdit && onSwitchSpecies && (
              <button
                onClick={() => onSwitchSpecies(id)}
                className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                title="Switch Species"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            )}
            {isAdmin && (imagekitFilePath || driveFileId) && (
              <button
                onClick={handleSetFeatured}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                title="Set as Featured Photo"
              >
                <Star className="h-4 w-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                title="Delete Photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{sighting?.location || 'Location unavailable'}</span>
          </div>
          {sighting && (
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <Pin className="h-4 w-4 shrink-0 text-slate-400" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCoordinateClick?.(sighting.id) }}
                className="text-left text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {sighting.mapCoords[0].toFixed(6)}, {sighting.mapCoords[1].toFixed(6)}
              </button>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{sighting ? format(new Date(sighting.datetimeOfSighting), 'MMM dd, yyyy • HH:mm') : 'Date unavailable'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 min-w-0">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{username}</span>
            </div>
            <button type="button" onClick={handleHeart} className="flex items-center gap-1.5 text-red-500 transition-colors" title={hasHearted ? "Remove heart" : "Give a heart"}>
              <Heart className={`h-5 w-5 ${user ? 'hover:fill-current' : ''} ${hasHearted ? 'fill-current' : ''}`} />
              <span className="font-semibold">{hearts ?? 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative w-full max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center max-h-[90vh]">
              <div className="flex-1 min-w-0 flex items-center justify-center bg-black/20 rounded-xl p-2">
                <img
                  src={fullImgSrc}
                  alt={`Bird photo taken at ${sighting?.location || 'unknown location'}`}
                  className="max-w-full max-h-[72vh] md:max-h-[84vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
              <div className="w-full md:w-80 bg-white dark:bg-slate-900 rounded-xl p-6 overflow-y-auto text-slate-700 dark:text-slate-300">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Photo Information</h4>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold">Location</div>
                    <div>{sighting?.location || '—'}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Coordinates</div>
                    <div>{sighting ? `${sighting.mapCoords[0].toFixed(6)}, ${sighting.mapCoords[1].toFixed(6)}` : '—'}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Date & Time</div>
                    <div>{sighting ? format(new Date(sighting.datetimeOfSighting), 'MMM dd, yyyy • HH:mm') : '—'}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Added by</div>
                    <div>{username}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Info</div>
                    <div className="whitespace-pre-wrap leading-relaxed">{sighting?.info || 'No additional information.'}</div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition-colors shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default BirdPhotoCard