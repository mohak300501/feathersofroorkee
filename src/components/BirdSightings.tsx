import { Plus, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { BirdSighting } from '../interfaces/BirdSighting'

interface BirdSightingsProps {
  sightings: BirdSighting[]
  user: any
  isAdmin: boolean
  onAddSighting: () => void
  onCoordinateClick: (sightingId: string) => void
  onEditSighting: (sightingId: string) => void
  onDeleteSighting: (sightingId: string) => void
}

const BirdSightings = ({ sightings, user, isAdmin, onAddSighting, onCoordinateClick, onEditSighting, onDeleteSighting }: BirdSightingsProps) => {
  const filteredSightings = sightings.filter(s => !s.photoId)
  const sorted = [...filteredSightings].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

  return (
    <section className="space-y-6">
      {user && (
        <div className="flex justify-end">
          <button onClick={onAddSighting} className="btn-primary inline-flex items-center gap-2 shadow-xl hover:-translate-y-1">
            <Plus className="h-5 w-5" />
            Add Sighting
          </button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80">
              <tr>
                {['Sr. No.', 'Username', 'Location', 'Coordinates', 'Date', 'Info', 'Actions'].map(label => (
                  <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sorted.map((sighting, index) => (
                <tr key={sighting.sightingId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{sorted.length - index}</td>
                  <td className="px-4 py-4 font-medium text-slate-800 dark:text-slate-200">{sighting.username}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{sighting.location}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => onCoordinateClick(sighting.sightingId)} className="text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap">
                      {sighting.mapCoords[0].toFixed(6)}, {sighting.mapCoords[1].toFixed(6)}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">{format(new Date(sighting.datetimeOfSighting), 'MMM dd, yyyy • HH:mm')}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400 min-w-56 whitespace-pre-wrap">{sighting.info || '—'}</td>
                  <td className="px-4 py-4">
                    {(user?.uid === sighting.userId || isAdmin) && (
                      <div className="flex items-center space-x-3">
                        <button onClick={() => onEditSighting(sighting.sightingId)} className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDeleteSighting(sighting.sightingId)} className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && <div className="py-12 text-center text-slate-500 dark:text-slate-400">No sightings yet.</div>}
      </div>
    </section>
  )
}

export default BirdSightings
