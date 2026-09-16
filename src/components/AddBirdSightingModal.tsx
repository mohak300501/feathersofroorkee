import React, { useState } from 'react'
import { X, MapPin, CalendarDays, Clock, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import BirdSightingsMap from './BirdSightingsMap'
import type { BirdSighting, SightingFormData } from '../interfaces/BirdSighting'

export interface AddBirdSightingModalProps {
  onClose: () => void
  onAdd: (data: SightingFormData) => Promise<void>
  submitting?: boolean
}

export const SightingFields = ({
  value,
  onChange,
}: {
  value: SightingFormData
  onChange: (next: SightingFormData) => void
}) => {
  const update = (patch: Partial<SightingFormData>) => onChange({ ...value, ...patch })

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
        <div className="relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            value={value.location}
            onChange={(e) => update({ location: e.target.value })}
            className="input-field pl-12"
            placeholder="Where was the bird sighted?"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Coordinates</label>
        <BirdSightingsMap
          sightings={[] as BirdSighting[]}
          onMapClick={(coords) => update({ mapCoords: coords })}
          selectedCoords={value.mapCoords}
          heightClassName="h-64"
          zoom={13}
        />
        <input
          type="text"
          value={value.mapCoords ? `${value.mapCoords[0].toFixed(6)}, ${value.mapCoords[1].toFixed(6)}` : ''}
          placeholder="Click the desired point on the map"
          className="input-field mt-3 bg-slate-100 dark:bg-slate-800"
          disabled
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date & Time of Sighting</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative group">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="date"
              value={value.dateOfSighting}
              onChange={(e) => update({ dateOfSighting: e.target.value })}
              className="input-field pl-12"
              required
            />
          </div>
          <div className="relative group">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="time"
              value={value.timeOfSighting}
              onChange={(e) => update({ timeOfSighting: e.target.value })}
              className="input-field pl-12"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Info</label>
        <div className="relative group">
          <Info className="absolute left-4 top-4 text-slate-400 h-5 w-5" />
          <textarea
            value={value.info}
            onChange={(e) => update({ info: e.target.value })}
            className="input-field pl-12 min-h-24 resize-y"
            placeholder="Additional information about this sighting"
          />
        </div>
      </div>
    </>
  )
}

const AddBirdSightingModal = ({ onClose, onAdd, submitting = false }: AddBirdSightingModalProps) => {
  const [value, setValue] = useState<SightingFormData>({
    location: '',
    mapCoords: null,
    info: '',
    dateOfSighting: '',
    timeOfSighting: '',
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!value.location || !value.mapCoords || !value.dateOfSighting || !value.timeOfSighting) {
      toast.error('Please fill in location, coordinates, date and time')
      return
    }

    await onAdd(value)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Add Sighting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <SightingFields value={value} onChange={setValue} />
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Sighting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBirdSightingModal
