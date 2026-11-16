import { Camera } from 'lucide-react'
import type { WalkPhoto } from '../../interfaces/Walk'
import WalkPhotoCard from './WalkPhotoCard'

interface WalkPhotosProps {
  photos: WalkPhoto[]
  onAddPhoto: () => void
  onEditPhoto: (photoId: string, info: string) => Promise<void>
  onDeletePhoto: (photoId: string) => Promise<void>
}

const WalkPhotos = ({ photos, onAddPhoto, onEditPhoto, onDeletePhoto }: WalkPhotosProps) => (
  <section className="space-y-6 pt-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Walk Photos
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Photos and memories shared by participants from this birdwalk.
        </p>
      </div>

      <button
        onClick={onAddPhoto}
        className="btn-primary py-2.5 px-4 text-sm inline-flex items-center space-x-2 self-start sm:self-auto"
      >
        <Camera className="w-4 h-4" />
        <span>Add a Photo</span>
      </button>
    </div>

    {photos.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <WalkPhotoCard key={photo._id} photo={photo} onEditPhoto={onEditPhoto} onDeletePhoto={onDeletePhoto} />
        ))}
      </div>
    ) : (
      <div className="glass-card p-12 text-center rounded-2xl space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center mx-auto">
          <Camera className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            No memories shared yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Were you part of this walk? Be the first to share your favourite moments or reflections!
          </p>
        </div>
        <button
          onClick={onAddPhoto}
          className="btn-primary text-sm px-6 py-2.5 inline-flex items-center space-x-2"
        >
          <Camera className="w-4 h-4" />
          <span>Share Experience</span>
        </button>
      </div>
    )}
  </section>
)

export default WalkPhotos
