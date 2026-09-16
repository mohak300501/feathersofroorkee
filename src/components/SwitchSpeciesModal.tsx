import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Bird } from 'lucide-react'
import { BirdPhoto } from '../interfaces/BirdPhoto'

interface SwitchSpeciesModalProps {
  photo: BirdPhoto
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

export default SwitchSpeciesModal;
