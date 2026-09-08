import { useState } from 'react'
import { Quote } from 'lucide-react'

interface GalleryPhoto {
  _id: string
  imagekitFilePath: string
  driveFileId: string
  experience: string
  username: string
}

interface GalleryCardProps {
  photo: GalleryPhoto
}

const GalleryCard = ({ photo }: GalleryCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
    <div 
      className="glass-card group flex flex-col h-full overflow-hidden hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
      onClick={() => setIsModalOpen(true)}
    >
      <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <img
          src={photo.imagekitFilePath ? `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${photo.imagekitFilePath}` : `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w800`}
          alt="Gallery Photo"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
             (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w800`
          }}
        />
      </div>
      
      {photo.experience && (
        <div className="p-5 flex-1 flex flex-col">
          <Quote className="w-5 h-5 text-primary-400 dark:text-primary-500 mb-2 shrink-0" />
          <div className="relative flex-1 flex flex-col">
            <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed line-clamp-3 flex-1">
              "{photo.experience}"
            </p>
            {photo.experience.length > 100 && (
              <span className="text-primary-600 dark:text-primary-400 text-xs font-bold mt-2">
                ... Read More
              </span>
            )}
          </div>
          {photo.username && (
             <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400">
               Shared by <span className="text-primary-600 dark:text-primary-400">@{photo.username}</span>
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
          <div className="md:w-3/5 bg-slate-900 relative flex items-center justify-center">
            <img
              src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${photo.imagekitFilePath}`}
              alt="Gallery Photo Full"
              className="max-w-full max-h-[50vh] md:max-h-[90vh] object-contain"
              onError={(e) => {
                 (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w1600`
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
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <Quote className="w-8 h-8 text-primary-200 dark:text-primary-800 mb-4 shrink-0" />
            <p className="text-slate-700 dark:text-slate-200 italic text-base md:text-lg leading-relaxed">
              "{photo.experience}"
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default GalleryCard
