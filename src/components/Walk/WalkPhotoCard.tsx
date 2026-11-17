import { useState } from 'react'
import { Quote, User, Calendar, Eye, Edit3, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { WalkPhoto } from '../../interfaces/Walk'
import { useAuth } from '../../contexts/AuthContext'
import EditWalkPhotoModal from './EditWalkPhotoModal'

export interface WalkPhotoCardProps {
  photo: WalkPhoto
  onEditPhoto: (photoId: string, info: string) => Promise<void>
  onDeletePhoto: (photoId: string) => Promise<void>
}

const WalkPhotoCard = ({ photo, onEditPhoto, onDeletePhoto }: WalkPhotoCardProps) => {
  const { user, isAdmin } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const canEdit = Boolean(user && (user.uid === photo.userId || isAdmin))

  const imageUrl = photo.imagekitFilePath
    ? (photo.imagekitFilePath.startsWith('http')
      ? photo.imagekitFilePath
      : `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${photo.imagekitFilePath}`)
    : (photo.driveFileId ? `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w800` : '')

  return (
    <>
      <div className="photo-card flex flex-col cursor-pointer" onClick={() => setIsModalOpen(true)}>
        <div className="relative group aspect-[4/3] bg-slate-200 dark:bg-slate-700 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Walk Photo"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onClick={() => setIsModalOpen(true)}
              onError={(e) => { console.error('Image failed to load:', imageUrl, '. ', e); }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="opacity-0 group-hover:opacity-100 bg-white/80 p-2.5 rounded-full transition-all duration-300 hover:bg-white shadow-lg"
            >
              <Eye className="h-5 w-5 text-slate-700" />
            </button>
          </div>
          {canEdit && (
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsEditing(true)
                }}
                className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition-colors"
                title="Edit photo info"
                aria-label="Edit photo info"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  void onDeletePhoto(photo._id)
                }}
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
                title="Delete photo"
                aria-label="Delete photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {photo.info && (
          <div className="p-5 flex-1 flex flex-col">
            <Quote className="w-5 h-5 text-primary-400 dark:text-primary-500 mb-2 shrink-0" />
            <div className="relative flex-1 flex flex-col">
              <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed line-clamp-3 flex-1">
                "{photo.info}"
              </p>
              {photo.info.length > 100 && (
                <span className="text-primary-600 dark:text-primary-400 text-xs font-bold mt-2">
                  ... Read More
                </span>
              )}
            </div>
            {photo.username && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-primary-600 dark:text-primary-400">@{photo.username}</span>
              </div>
            )}
            {photo.addedAt && (
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{format(new Date(photo.addedAt), 'MMM dd, yyyy • HH:mm')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Photo side */}
            <div className="md:w-3/5 bg-slate-900 relative flex items-center justify-center p-2">
              <img
                src={imageUrl}
                alt="Walk Photo Full"
                className="max-w-full max-h-[50vh] md:max-h-[90vh] object-contain"
                onError={(e) => {
                  if (photo.driveFileId) {
                    (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w1600`
                  }
                }}
              />
            </div>
            {/* Content side */}
            <div className="md:w-2/5 p-6 md:p-8 flex flex-col max-h-[40vh] md:max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                {photo.username && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Shared by</p>
                    <p className="font-bold text-lg text-slate-800 dark:text-white">@{photo.username}</p>
                  </div>
                )}
                {isEditing && (
                  <EditWalkPhotoModal
                    initialInfo={photo.info || ''}
                    onClose={() => setIsEditing(false)}
                    onSave={async (info) => {
                      await onEditPhoto(photo._id, info)
                      setIsEditing(false)
                    }}
                  />
                )}
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>

              {photo.info && (
                <>
                  <Quote className="w-8 h-8 text-primary-200 dark:text-primary-800 mb-4 shrink-0" />
                  <p className="text-slate-700 dark:text-slate-200 italic text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                    "{photo.info}"
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WalkPhotoCard
