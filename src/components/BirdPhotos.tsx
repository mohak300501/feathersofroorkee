import { Camera, Upload } from 'lucide-react'
import BirdPhotoCard from './BirdPhotoCard'
import type { BirdPhoto } from '../interfaces/BirdPhoto'
import type { BirdSighting } from '../interfaces/BirdSighting'

interface BirdPhotosProps {
  photos: BirdPhoto[]
  sightings: BirdSighting[]
  user: any
  onAddPhoto: () => void
  onDelete: (photoId: string) => Promise<void>
  onSetFeatured: (fileId: string) => Promise<void>
  onEditInfo: (photoId: string) => void
  onSwitchSpecies: (photoId: string) => void
  onCoordinateClick: (sightingId: string) => void
  onHeart: (photoId: string) => Promise<number>
}

const BirdPhotos = ({ photos, sightings, user, onAddPhoto, onDelete, onSetFeatured, onEditInfo, onSwitchSpecies, onCoordinateClick, onHeart }: BirdPhotosProps) => {
  const sightingByPhotoId = new Map(sightings.filter(s => s.photoId).map(s => [s.photoId, s]))

  return (
    <section className="space-y-8">
      {user && (
        <div className="text-center">
          <button onClick={onAddPhoto} className="btn-primary inline-flex items-center space-x-2 shadow-xl hover:-translate-y-1">
            <Upload className="h-5 w-5" />
            <span>Add Photo</span>
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="glass-card text-center py-16 max-w-lg mx-auto">
          <div className="p-4 bg-slate-100 dark:bg-dark-surface rounded-full inline-block mb-6 shadow-inner">
            <Camera className="h-16 w-16 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No photos yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-lg">{user ? 'Be the first to add a photo of this bird!' : 'Sign in to add photos of this bird.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {photos.map(photo => {
            const sighting = sightingByPhotoId.get(photo.id)
            return (
              <BirdPhotoCard
                key={photo.id}
                {...photo}
                sighting={sighting ? {
                  id: sighting.sightingId,
                  photoId: sighting.photoId,
                  userId: sighting.userId,
                  username: sighting.username,
                  mapCoords: sighting.mapCoords,
                  location: sighting.location,
                  info: sighting.info,
                  datetimeOfSighting: sighting.datetimeOfSighting,
                  addedAt: sighting.addedAt,
                } : undefined}
                onDelete={onDelete}
                onSetFeatured={onSetFeatured}
                onEditInfo={onEditInfo}
                onSwitchSpecies={onSwitchSpecies}
                onCoordinateClick={onCoordinateClick}
                onHeart={onHeart}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export default BirdPhotos
