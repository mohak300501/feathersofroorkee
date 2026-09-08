import React, { useState } from 'react'
import { X } from 'lucide-react'
import { IUCN_STATUS_MAP } from '../utils/iucn_map'
import toast from 'react-hot-toast'

export interface FamilyData {
  id: string
  familyName: string
  familyOf: string[]
  taxoPos: number
}

interface AddBirdModalProps {
  onClose: () => void;
  onAdd: (cn: string, sn: string, fid: string, iucn: string, isMig: boolean, info: string) => Promise<void>;
  adding: boolean;
  families: FamilyData[]
}

const AddBirdModal = ({ onClose, onAdd, adding, families }: AddBirdModalProps) => {
  const [commonName, setCommonName] = useState('')
  const [scientificName, setScientificName] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [iucnStatus, setIucnStatus] = useState('LC')
  const [isMigratory, setIsMigratory] = useState(false)
  const [info, setInfo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commonName || !scientificName) { toast.error('Please fill required fields'); return; }
    await onAdd(commonName, scientificName, familyId, iucnStatus, isMigratory, info)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Bird</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Common Name *</label>
            <input type="text" value={commonName} onChange={(e) => setCommonName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Scientific Name *</label>
            <input type="text" value={scientificName} onChange={(e) => setScientificName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Family *</label>
            <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className="input-field" required>
              <option value="">Select a family...</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.familyName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">IUCN Status *</label>
            <select value={iucnStatus} onChange={(e) => setIucnStatus(e.target.value)} className="input-field" required>
              {Object.entries(IUCN_STATUS_MAP).map(([code, { label }]) => (
                <option key={code} value={code}>{label} ({code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Migratory Status *</label>
            <select value={isMigratory ? "true" : "false"} onChange={(e) => setIsMigratory(e.target.value === "true")} className="input-field" required>
              <option value="false">Resident</option>
              <option value="true">Migratory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bird Description</label>
            <textarea value={info} onChange={(e) => setInfo(e.target.value)} className="input-field min-h-[100px]" placeholder="Add interesting facts, habitat details..." />
          </div>
          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={adding}>Cancel</button>
            <button type="submit" disabled={adding} className="btn-primary flex-1">{adding ? 'Adding...' : 'Add Bird'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBirdModal
