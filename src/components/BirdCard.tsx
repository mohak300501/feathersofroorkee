import { Link } from 'react-router-dom'
import { Bird, Camera } from 'lucide-react'
import { IUCN_STATUS_MAP } from '../utils/iucn_map'

interface BirdCardProps {
  id: string
  commonName: string
  scientificName: string
  photoCount: number
  featuredPhoto: string
  commonCode: string
  iucnStatus: string
  isMigratory: boolean
}

const BirdCard = ({ id, commonName, scientificName, photoCount, featuredPhoto, commonCode, iucnStatus, isMigratory }: BirdCardProps) => {
  return (
    <Link to={commonCode ? `/bird/${commonCode.toLowerCase()}` : `/bird/${id}`}>
      <div className="bird-card group">
        <div className="relative h-56 bg-slate-200 dark:bg-slate-700 overflow-hidden">
          {featuredPhoto ? (
            <img
              src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${featuredPhoto}?tr=w-800,f-auto,q-auto`}
              alt={commonName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
              onError={(e) => {
                // fallback if servePhoto doesn't work for this
                (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${featuredPhoto}&sz=w800`
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-bird-50 dark:from-slate-700 dark:to-slate-800 group-hover:scale-105 transition-transform duration-500">
              <Bird className="h-20 w-20 text-primary-300 dark:text-slate-600" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-1.5 shadow-lg">
            <Camera className="h-4 w-4" />
            <span>{photoCount}</span>
          </div>
        </div>
        <div className="p-5 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1">
              {commonName}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              {scientificName}
            </p>
          </div>
          <div className="flex flex-col space-y-1.5 items-center justify-center ml-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold 
                ${IUCN_STATUS_MAP[iucnStatus] ? IUCN_STATUS_MAP[iucnStatus].color : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'}`}
              title={IUCN_STATUS_MAP[iucnStatus] ? IUCN_STATUS_MAP[iucnStatus].label : 'IUCN Status'}
            >
              {iucnStatus}
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isMigratory ? 'bg-pink-500 shadow-pink-500/30' : 'bg-blue-500 shadow-blue-500/30'}`} title="Migratory Status">
              {isMigratory ? 'M' : 'R'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BirdCard