import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Plus, Trash2, Settings, Edit2, X, FolderTree, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserData {
  uid: string
  email: string
  username: string
  isAdmin: boolean
  photoCount: number
  workshopCount: number
}

interface FamilyData {
  id: string
  familyName: string
  familyOf: string[]
  taxoPos: number
}

const AdminPanel = () => {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [families, setFamilies] = useState<FamilyData[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false)
  const [addingFamily, setAddingFamily] = useState(false)
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false)
  const [editingFamily, setEditingFamily] = useState<FamilyData | null>(null)
  const [editingFamilyLoading, setEditingFamilyLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      return
    }
    fetchData()
  }, [isAdmin])

  const fetchData = async () => {
    try {
      const [usersRes, familiesRes] = await Promise.all([
        fetch(`/api/General/getUsers?userId=${user?.uid}`),
        fetch('/api/Bird/getFamilies')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.users);
      }

      if (familiesRes.ok) {
        const famData = await familiesRes.json();
        if (famData.success) setFamilies(famData.families);
      }

    } catch (error: any) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }



  const handleAddFamily = async (familyName: string, familyOf: string, taxoPos: number) => {
    setAddingFamily(true)
    try {
      const response = await fetch('/api/Bird/addFamily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyName, familyOf, taxoPos, userId: user?.uid }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add family')
      }
      toast.success('Family added successfully!')
      setShowAddFamilyModal(false)
      fetchData()
    } catch (error: any) {
      console.error('Error adding family:', error)
      toast.error(error.message || 'Failed to add family')
    } finally {
      setAddingFamily(false)
    }
  }

  const handleEditFamily = async (familyId: string, familyName: string, familyOf: string, taxoPos: number) => {
    setEditingFamilyLoading(true)
    try {
      const response = await fetch('/api/Bird/editFamily', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, familyName, familyOf, taxoPos, userId: user?.uid }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to edit family')
      }
      toast.success('Family updated successfully!')
      setShowEditFamilyModal(false)
      fetchData()
    } catch (error: any) {
      console.error('Error editing family:', error)
      toast.error(error.message || 'Failed to edit family')
    } finally {
      setEditingFamilyLoading(false)
    }
  }

  const handleDeleteFamily = async (familyId: string, familyName: string) => {
    if (!window.confirm(`Are you sure you want to delete family "${familyName}"?`)) return;
    try {
      const response = await fetch('/api/Bird/deleteFamily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, userId: user?.uid }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete family')
      }
      toast.success('Family deleted successfully!')
      fetchData()
    } catch (error: any) {
      console.error('Error deleting family:', error)
      toast.error(error.message || 'Failed to delete family')
    }
  }

  if (!isAdmin) {
    return (
      <div className="glass-card text-center py-16 max-w-lg mx-auto mt-12">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full inline-block mb-6 shadow-inner">
          <Settings className="h-16 w-16 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Access Denied</h3>
        <p className="text-slate-500 dark:text-slate-400 text-lg">You need admin privileges to access this page.</p>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-10 animate-fade-in relative z-10 py-6">
      <div className="text-center space-y-4">
        <h1 className="section-header">Admin Dashboard</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">Manage birds, families and platform features</p>
      </div>


      {/* Users Management */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 dark:border-slate-700 gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            <span>Users Directory</span>
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-2">No users found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Photos Submitted</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workshops Attended</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">@{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">{u.photoCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">{u.workshopCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isAdmin ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'}`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Families Management */}
      <div className="glass-card p-0 overflow-hidden mt-8">
        <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 dark:border-slate-700 gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-primary-500" />
            <span>Families Directory</span>
          </h2>
          <button onClick={() => setShowAddFamilyModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Family</span>
          </button>
        </div>

        {families.length === 0 ? (
          <div className="text-center py-16">
            <FolderTree className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-2">No families yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Family Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Family Of</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taxo Pos</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {families.map((fam) => (
                  <tr key={fam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{fam.familyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{fam.familyOf.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{fam.taxoPos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex items-center justify-end space-x-4">
                        <button onClick={() => { setEditingFamily(fam); setShowEditFamilyModal(true) }} className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors flex items-center space-x-1">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteFamily(fam.id, fam.familyName)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center space-x-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddFamilyModal && <AddFamilyModal onClose={() => setShowAddFamilyModal(false)} onAdd={handleAddFamily} adding={addingFamily} />}
      {showEditFamilyModal && editingFamily && <EditFamilyModal family={editingFamily} onClose={() => { setShowEditFamilyModal(false); setEditingFamily(null) }} onEdit={handleEditFamily} editing={editingFamilyLoading} />}
    </div>
  )
}

interface AddFamilyModalProps { onClose: () => void; onAdd: (fn: string, fo: string, tp: number) => Promise<void>; adding: boolean }
const AddFamilyModal = ({ onClose, onAdd, adding }: AddFamilyModalProps) => {
  const [familyName, setFamilyName] = useState('')
  const [familyOf, setFamilyOf] = useState('')
  const [taxoPos, setTaxoPos] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAdd(familyName, familyOf, taxoPos)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add Family</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Family Name *</label>
            <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="input-field" required placeholder="e.g. Coraciidae" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Family Of (Comma Separated) *</label>
            <input type="text" value={familyOf} onChange={(e) => setFamilyOf(e.target.value)} className="input-field" required placeholder="e.g. Rollers" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Taxonomic Position *</label>
            <input type="number" step="any" value={taxoPos} onChange={(e) => setTaxoPos(Number(e.target.value))} className="input-field" required />
          </div>
          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={adding}>Cancel</button>
            <button type="submit" disabled={adding} className="btn-primary flex-1">{adding ? 'Adding...' : 'Add Family'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditFamilyModalProps { family: FamilyData; onClose: () => void; onEdit: (id: string, fn: string, fo: string, tp: number) => Promise<void>; editing: boolean }
const EditFamilyModal = ({ family, onClose, onEdit, editing }: EditFamilyModalProps) => {
  const [familyName, setFamilyName] = useState(family.familyName)
  const [familyOf, setFamilyOf] = useState(family.familyOf.join(', '))
  const [taxoPos, setTaxoPos] = useState(family.taxoPos)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onEdit(family.id, familyName, familyOf, taxoPos)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Family</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Family Name *</label>
            <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Family Of (Comma Separated) *</label>
            <input type="text" value={familyOf} onChange={(e) => setFamilyOf(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Taxonomic Position *</label>
            <input type="number" step="any" value={taxoPos} onChange={(e) => setTaxoPos(Number(e.target.value))} className="input-field" required />
          </div>
          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={editing}>Cancel</button>
            <button type="submit" disabled={editing} className="btn-primary flex-1">{editing ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminPanel
