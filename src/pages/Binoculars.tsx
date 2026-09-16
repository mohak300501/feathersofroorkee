import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Binoculars as BinocularsIcon, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  Edit3, Eye, PackageCheck, Plus, QrCode, Trash2, User, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import AddBinocModal from '../components/AddBinocModal'
import EditBinocModal from '../components/EditBinocModal'
import ScanModal from '../components/ScanBinocModal'
import BorrowModal, { ScannedBinocular } from '../components/BorrowBinocModal'
import type { Binocular, InventoryRow, TransactionRow } from '../interfaces/Binoc'

const Binoculars = () => {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    if (!user) throw new Error('Authentication required')
    const token = await user.getIdToken()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  }, [user])

  const [binoculars, setBinoculars] = useState<Binocular[]>([])
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [transactionPage, setTransactionPage] = useState(1)
  const [transactionTotalPages, setTransactionTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [selectedBinocular, setSelectedBinocular] = useState<Binocular | null>(null)
  const [scannedBinocular, setScannedBinocular] = useState<ScannedBinocular | null>(null)

  const fetchAdminBinoculars = useCallback(async () => {
    if (!user || !isAdmin) return
    const headers = await getAuthHeaders()
    const response = await fetch('/api/Binoculars/getBinoculars', { headers })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load binoculars')
    setBinoculars(data.binoculars || [])
  }, [getAuthHeaders, user, isAdmin])

  const fetchInventory = useCallback(async () => {
    const response = await fetch('/api/Binoculars/getInventory')
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load inventory')
    setInventory(data.inventory || [])
  }, [])

  const fetchTransactions = useCallback(async (page = transactionPage) => {
    const response = await fetch(`/api/Binoculars/getTransactions?page=${page}&limit=20`)
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load transactions')
    setTransactions(data.transactions || [])
    setTransactionPage(data.page || page)
    setTransactionTotalPages(data.totalPages || 1)
  }, [transactionPage])

  const refreshPage = useCallback(async (page = transactionPage) => {
    setLoading(true)
    try {
      await Promise.all([
        fetchInventory(),
        fetchTransactions(page),
        isAdmin ? fetchAdminBinoculars() : Promise.resolve(),
      ])
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to load binocular data')
    } finally {
      setLoading(false)
    }
  }, [fetchAdminBinoculars, fetchInventory, fetchTransactions, isAdmin, transactionPage])

  useEffect(() => {
    refreshPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user?.uid])

  const handleAdd = async (make: string, physicalId: string) => {
    if (!user || !isAdmin) return
    const response = await fetch('/api/Binoculars/addBinocular', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ make, physicalId })
    })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add binocular')
    toast.success('Binocular added successfully')
    setShowAddModal(false)
    await refreshPage(1)
  }

  const handleEdit = async (make: string, physicalId: string) => {
    if (!user || !isAdmin || !selectedBinocular) return
    const response = await fetch('/api/Binoculars/editBinocular', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ binocId: selectedBinocular.binocId, make, physicalId })
    })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to update binocular')
    toast.success('Binocular updated successfully')
    setShowEditModal(false)
    setSelectedBinocular(null)
    await refreshPage(transactionPage)
  }

  const handleDelete = async (binoc: Binocular) => {
    if (!user || !isAdmin) return
    const confirmed = window.confirm(`Delete binocular ${binoc.physicalId}? This cannot be undone.`)
    if (!confirmed) return

    const response = await fetch('/api/Binoculars/deleteBinocular', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ binocId: binoc.binocId }),
    })
    const data = await response.json()
    if (!response.ok || !data.success) {
      toast.error(data.error || 'Failed to delete binocular')
      return
    }
    toast.success('Binocular deleted')
    await refreshPage(transactionPage)
  }

  const handleScan = useCallback(async (payload: string) => {
    if (!user) return
    const response = await fetch('/api/Binoculars/scanBinocular', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ payload }),
    })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Invalid binocular QR')
    setShowScanModal(false)
    setScannedBinocular(data.binocular)
  }, [user])

  const handleBorrow = async () => {
    if (!user || !scannedBinocular) return
    const response = await fetch('/api/Binoculars/borrowBinocular', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ binocId: scannedBinocular.binocId }),
    })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Unable to borrow binocular')
    toast.success('Binocular borrowed')
    setScannedBinocular(null)
    await refreshPage(transactionPage)
    navigate('/binoculars')
  }

  const handleReturn = async () => {
    if (!user || !scannedBinocular) return
    const response = await fetch('/api/Binoculars/returnBinocular', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ binocId: scannedBinocular.binocId }),
    })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.error || 'Unable to return binocular')
    toast.success('Binocular returned')
    setScannedBinocular(null)
    await refreshPage(transactionPage)
    navigate('/binoculars')
  }

  const handleTransactionPage = async (page: number) => {
    if (page < 1 || page > transactionTotalPages || page === transactionPage) return
    try {
      await fetchTransactions(page)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load transactions')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="text-center pt-4">
        <div className="inline-flex p-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 mb-5">
          <BinocularsIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="section-header">Binoculars</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
          Borrow and return the club's binoculars for birding, via QR codes
        </p>
      </section>

      {isAdmin && (
        <section className="glass-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Binoculars</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Create QR stickers from each binocular's encrypted hash.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              Add a Binocular
            </button>
          </div>

          <div className="overflow-x-auto mt-6">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Sr. No.', 'Make', 'Physical ID', 'Encrypted Hash', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {binoculars.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                      No binoculars added yet.
                    </td>
                  </tr>
                ) : binoculars.map((binoc, index) => (
                  <tr key={binoc.binocId} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{index + 1}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{binoc.make}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{binoc.physicalId}</td>
                    <td className="px-4 py-4">
                      <code className="block max-w-[420px] break-all text-xs text-slate-500 dark:text-slate-400" title={binoc.hash}>
                        {binoc.hash}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                          onClick={() => { setSelectedBinocular(binoc); setShowEditModal(true) }}
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(binoc)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="h-6 w-6 text-primary-600" />
              Inventory
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Current availability by make.</p>
          </div>
          {user && (
            <button
              onClick={() => setShowScanModal(true)}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <QrCode className="h-5 w-5" />
              Scan QR to Borrow/Return
            </button>
          )}
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Make', 'Available', 'Total'].map((heading) => (
                  <th key={heading} className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">No binocular inventory.</td></tr>
              ) : inventory.map((row) => (
                <tr key={row.make} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{row.make}</td>
                  <td className="px-4 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{row.available}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary-600" />
            Transactions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Most recent borrow and return activity.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Sr. No.', 'Username', 'Physical ID', 'Borrowed At', 'Returned At'].map((heading) => (
                  <th key={heading} className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">No transactions yet.</td></tr>
              ) : transactions.map((tx, index) => (
                <tr key={tx.transactionId} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{(transactionPage - 1) * 20 + index + 1}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <User className="h-4 w-4 text-slate-400" />
                      {tx.username}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{tx.physicalId}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      {new Date(tx.borrowedAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {tx.returnedAt ? (
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {new Date(tx.returnedAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <XCircle className="h-4 w-4" />
                        Borrowed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactionTotalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
            <button
              onClick={() => handleTransactionPage(transactionPage - 1)}
              disabled={transactionPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: transactionTotalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handleTransactionPage(page)}
                className={`min-w-10 px-3 py-2 rounded-lg text-sm font-semibold ${page === transactionPage
                    ? 'bg-primary-600 text-white'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handleTransactionPage(transactionPage + 1)}
              disabled={transactionPage === transactionTotalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </section>

      {showAddModal && (
        <AddBinocModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}

      {showEditModal && selectedBinocular && (
        <EditBinocModal
          binocular={selectedBinocular}
          onClose={() => { setShowEditModal(false); setSelectedBinocular(null) }}
          onSave={handleEdit}
        />
      )}

      {showScanModal && (
        <ScanModal
          onClose={() => setShowScanModal(false)}
          onScanned={handleScan}
        />
      )}

      {scannedBinocular && (
        <BorrowModal
          binocular={scannedBinocular}
          onClose={() => setScannedBinocular(null)}
          onBorrow={handleBorrow}
          onReturn={handleReturn}
        />
      )}
    </div>
  )
}

export default Binoculars
