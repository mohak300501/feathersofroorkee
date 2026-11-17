import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/General/LoadingSpinner'
import { Plus, Trash2, Settings, Edit2, X, FolderTree, Users, Upload, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { userTypes, type UserType } from '../utils/userTypes'
import { IUCN_STATUS_MAP } from '../utils/iucn_map'

const birdCsvHeaders = ['commonName', 'scientificName', 'familyId', 'iucnStatus', 'isMigratory', 'info']
const familyCsvHeaders = ['familyName', 'familyOf', 'taxoPos']

interface CsvBird {
  commonName: string
  scientificName: string
  familyId: string
  iucnStatus: string
  isMigratory: boolean
  info: string
  rowNumber: number
}

interface CsvFamily {
  familyName: string
  familyOf: string
  taxoPos: number
  rowNumber: number
}

interface CsvImportResult {
  added: number
  skipped: string[]
  failures: string[]
}

interface FamilyCsvImportResult {
  added: number
  skipped: string[]
  failures: string[]
}

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let closedQuotedCell = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (inQuotes) {
        inQuotes = !inQuotes
        closedQuotedCell = true
      } else if (cell.length === 0 && !closedQuotedCell) {
        inQuotes = true
      } else {
        throw new Error('Invalid quote in CSV file')
      }
    } else if (character === ',' && !inQuotes) {
      row.push(cell)
      cell = ''
      closedQuotedCell = false
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell)
      if (row.some(value => value.trim() !== '')) rows.push(row)
      row = []
      cell = ''
      closedQuotedCell = false
    } else {
      if (closedQuotedCell && character.trim() !== '') {
        throw new Error('Unexpected text after a quoted CSV value')
      }
      cell += character
    }
  }

  if (inQuotes) throw new Error('Unclosed quote in CSV file')
  row.push(cell)
  if (row.some(value => value.trim() !== '')) rows.push(row)
  return rows
}

const nonAdminUserTypes = Object.fromEntries(
  Object.entries(userTypes).filter(([value]) => value !== '0')
) as Partial<typeof userTypes>

interface UserData {
  uid: string
  email: string
  username: string
  whatsapp: string
  userType: UserType
  photoCount: number
  walkCount: number
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
  const [importingBirds, setImportingBirds] = useState(false)
  const [csvImportResult, setCsvImportResult] = useState<CsvImportResult | null>(null)
  const birdCsvInput = useRef<HTMLInputElement>(null)
  const [importingFamilies, setImportingFamilies] = useState(false)
  const [familyCsvImportResult, setFamilyCsvImportResult] = useState<FamilyCsvImportResult | null>(null)
  const familyCsvInput = useRef<HTMLInputElement>(null)

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
      const token = await user?.getIdToken()
      if (!token) throw new Error('Authentication required')
      const [usersRes, familiesRes] = await Promise.all([
        fetch('/api/General/getUsers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/Bird/getFamilies')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.users.map((userData: UserData) => ({
            ...userData,
            userType: userData.userType ?? 2
          })))
        }
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

  const handleUserTypeChange = async (targetUserId: string, userType: UserType) => {
    try {
      const token = await user?.getIdToken()
      if (!token) throw new Error('Authentication required')
      const response = await fetch('/api/General/updateUserType', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: targetUserId, userType })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user type')
      }
      setUsers(current => current.map(existing =>
        existing.uid === targetUserId ? { ...existing, userType } : existing
      ))
      toast.success('User type updated')
    } catch (error: unknown) {
      console.error('Error updating user type:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user type')
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
      if (!user) throw new Error('Please login to edit this family.')
      const token = await user.getIdToken()
      const response = await fetch('/api/Bird/editFamily', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      if (!user) throw new Error('Please login to delete this family.')
      const token = await user.getIdToken()
      const response = await fetch('/api/Bird/deleteFamily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const handleBirdCsvUpload = async (file: File) => {
    setCsvImportResult(null)
    try {
      const csvRows = parseCsv((await file.text()).replace(/^\uFEFF/, ''))
      if (csvRows.length < 2) throw new Error('CSV must include a header and at least one bird row')

      const headers = csvRows[0].map(header => header.trim())
      if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate column names')
      const missingHeaders = birdCsvHeaders.filter(header => !headers.includes(header))
      const unknownHeaders = headers.filter(header => !birdCsvHeaders.includes(header))
      if (missingHeaders.length || unknownHeaders.length) {
        const issues = [
          missingHeaders.length ? `missing columns: ${missingHeaders.join(', ')}` : '',
          unknownHeaders.length ? `unknown columns: ${unknownHeaders.join(', ')}` : '',
        ].filter(Boolean)
        throw new Error(`Invalid CSV header (${issues.join('; ')})`)
      }

      const column = Object.fromEntries(headers.map((header, index) => [header, index]))
      const birds: CsvBird[] = csvRows.slice(1).map((values, index) => {
        const rowNumber = index + 2
        if (values.length > headers.length) throw new Error(`CSV row ${rowNumber} has more values than the header`)

        const value = (header: string) => (values[column[header]] ?? '').trim()
        const commonName = value('commonName')
        const scientificName = value('scientificName')
        if (!commonName || !scientificName) {
          throw new Error(`CSV row ${rowNumber} must include commonName and scientificName`)
        }

        const rawFamily = value('familyId')
        const family = rawFamily
          ? families.find(candidate =>
            candidate.id === rawFamily || candidate.familyName.toLowerCase() === rawFamily.toLowerCase()
          )
          : undefined
        if (rawFamily && !family) throw new Error(`CSV row ${rowNumber} has an unknown familyId or family name`)

        const iucnStatus = value('iucnStatus').toUpperCase() || 'LC'
        if (!Object.prototype.hasOwnProperty.call(IUCN_STATUS_MAP, iucnStatus)) {
          throw new Error(`CSV row ${rowNumber} has an invalid iucnStatus: ${iucnStatus}`)
        }

        const migratoryValue = value('isMigratory').toLowerCase()
        if (migratoryValue && migratoryValue !== 'true' && migratoryValue !== 'false') {
          throw new Error(`CSV row ${rowNumber} isMigratory must be true or false`)
        }

        return {
          commonName,
          scientificName,
          familyId: family?.id ?? '',
          iucnStatus,
          isMigratory: migratoryValue === 'true',
          info: value('info'),
          rowNumber,
        }
      })

      const uniqueBirds: CsvBird[] = []
      const skipped: string[] = []
      const seenCommonNames = new Map<string, number>()
      const seenScientificNames = new Map<string, number>()
      for (const bird of birds) {
        const commonName = bird.commonName.toLowerCase()
        const scientificName = bird.scientificName.toLowerCase()
        const previousRow = seenCommonNames.get(commonName) ?? seenScientificNames.get(scientificName)
        if (previousRow !== undefined) {
          if (!seenCommonNames.has(commonName)) seenCommonNames.set(commonName, bird.rowNumber)
          if (!seenScientificNames.has(scientificName)) seenScientificNames.set(scientificName, bird.rowNumber)
          skipped.push(`Row ${bird.rowNumber} (${bird.commonName}) duplicates CSV row ${previousRow}`)
          continue
        }

        seenCommonNames.set(commonName, bird.rowNumber)
        seenScientificNames.set(scientificName, bird.rowNumber)
        uniqueBirds.push(bird)
      }

      if (uniqueBirds.length === 0) {
        const result = { added: 0, skipped, failures: [] }
        setCsvImportResult(result)
        toast.success(`No new birds to add; skipped ${skipped.length} duplicate row${skipped.length === 1 ? '' : 's'}`)
        return
      }

      const duplicateSummary = skipped.length > 0 ? ` (${skipped.length} duplicate row${skipped.length === 1 ? '' : 's'} will be skipped)` : ''
      if (!window.confirm(`Add ${uniqueBirds.length} unique bird${uniqueBirds.length === 1 ? '' : 's'} from this CSV${duplicateSummary}?`)) return
      if (!user) throw new Error('Please log in to add birds')

      setImportingBirds(true)
      const result: CsvImportResult = { added: 0, skipped, failures: [] }
      for (const bird of uniqueBirds) {
        try {
          const response = await fetch('/api/Bird/addBird', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commonName: bird.commonName,
              scientificName: bird.scientificName,
              familyId: bird.familyId,
              userId: user?.uid,
              iucnStatus: bird.iucnStatus,
              isMigratory: bird.isMigratory,
              info: bird.info,
            }),
          })
          const responseData = await response.json()
          if (response.status === 409) {
            result.skipped.push(`Row ${bird.rowNumber} (${bird.commonName}): ${responseData.error || 'Bird already exists'}`)
            continue
          }
          if (!response.ok || !responseData.success) {
            throw new Error(responseData.error || 'Failed to add bird')
          }
          result.added += 1
        } catch (error: unknown) {
          console.error(`Error importing CSV row ${bird.rowNumber}:`, error)
          result.failures.push(
            `Row ${bird.rowNumber} (${bird.commonName}): ${error instanceof Error ? error.message : 'Failed to add bird'}`
          )
        }
      }

      setCsvImportResult(result)
      if (result.failures.length === 0) {
        toast.success(`Added ${result.added}; skipped ${result.skipped.length} duplicate row${result.skipped.length === 1 ? '' : 's'}`)
      } else {
        toast.error(`Added ${result.added}; skipped ${result.skipped.length}; ${result.failures.length} row${result.failures.length === 1 ? '' : 's'} failed`)
      }
    } catch (error: unknown) {
      console.error('Error importing birds from CSV:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import birds from CSV')
    } finally {
      setImportingBirds(false)
      if (birdCsvInput.current) birdCsvInput.current.value = ''
    }
  }

  const downloadBirdCsvTemplate = () => {
    const blob = new Blob([`${birdCsvHeaders.join(',')}\r\n`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'bird-import-template.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const handleFamilyCsvUpload = async (file: File) => {
    setFamilyCsvImportResult(null)
    try {
      const csvRows = parseCsv((await file.text()).replace(/^\uFEFF/, ''))
      if (csvRows.length < 2) throw new Error('CSV must include a header and at least one family row')

      const headers = csvRows[0].map(header => header.trim())
      if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate column names')
      const missingHeaders = familyCsvHeaders.filter(header => !headers.includes(header))
      const unknownHeaders = headers.filter(header => !familyCsvHeaders.includes(header))
      if (missingHeaders.length || unknownHeaders.length) {
        const issues = [
          missingHeaders.length ? `missing columns: ${missingHeaders.join(', ')}` : '',
          unknownHeaders.length ? `unknown columns: ${unknownHeaders.join(', ')}` : '',
        ].filter(Boolean)
        throw new Error(`Invalid CSV header (${issues.join('; ')})`)
      }

      const column = Object.fromEntries(headers.map((header, index) => [header, index]))
      const familiesToImport: CsvFamily[] = csvRows.slice(1).map((values, index) => {
        const rowNumber = index + 2
        if (values.length > headers.length) throw new Error(`CSV row ${rowNumber} has more values than the header`)

        const value = (header: string) => (values[column[header]] ?? '').trim()
        const familyName = value('familyName')
        const familyOf = value('familyOf')
        const rawTaxoPos = value('taxoPos')
        const taxoPos = Number(rawTaxoPos)
        if (!familyName || !familyOf || !rawTaxoPos || !Number.isFinite(taxoPos)) {
          throw new Error(`CSV row ${rowNumber} must include familyName, familyOf, and a valid taxoPos`)
        }

        return { familyName, familyOf, taxoPos, rowNumber }
      })

      const uniqueFamilies: CsvFamily[] = []
      const skipped: string[] = []
      const seenFamilyNames = new Map<string, number>()
      for (const family of familiesToImport) {
        const familyName = family.familyName.toLowerCase()
        const previousRow = seenFamilyNames.get(familyName)
        if (previousRow !== undefined) {
          skipped.push(`Row ${family.rowNumber} (${family.familyName}) duplicates CSV row ${previousRow}`)
          continue
        }
        seenFamilyNames.set(familyName, family.rowNumber)
        uniqueFamilies.push(family)
      }

      if (uniqueFamilies.length === 0) {
        const result = { added: 0, skipped, failures: [] }
        setFamilyCsvImportResult(result)
        toast.success(`No new families to add; skipped ${skipped.length} duplicate row${skipped.length === 1 ? '' : 's'}`)
        return
      }

      const duplicateSummary = skipped.length > 0 ? ` (${skipped.length} duplicate row${skipped.length === 1 ? '' : 's'} will be skipped)` : ''
      if (!window.confirm(`Add ${uniqueFamilies.length} unique famil${uniqueFamilies.length === 1 ? 'y' : 'ies'} from this CSV${duplicateSummary}?`)) return
      if (!user) throw new Error('Please log in to add families')

      setImportingFamilies(true)
      const result: FamilyCsvImportResult = { added: 0, skipped, failures: [] }
      for (const family of uniqueFamilies) {
        try {
          const response = await fetch('/api/Bird/addFamily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              familyName: family.familyName,
              familyOf: family.familyOf,
              taxoPos: family.taxoPos,
              userId: user.uid,
            }),
          })
          const responseData = await response.json()
          if (response.status === 409) {
            result.skipped.push(`Row ${family.rowNumber} (${family.familyName}): ${responseData.error || 'Family already exists'}`)
            continue
          }
          if (!response.ok || !responseData.success) {
            throw new Error(responseData.error || 'Failed to add family')
          }
          result.added += 1
        } catch (error: unknown) {
          console.error(`Error importing family CSV row ${family.rowNumber}:`, error)
          result.failures.push(
            `Row ${family.rowNumber} (${family.familyName}): ${error instanceof Error ? error.message : 'Failed to add family'}`
          )
        }
      }

      setFamilyCsvImportResult(result)
      if (result.added > 0) await fetchData()
      if (result.failures.length === 0) {
        toast.success(`Added ${result.added}; skipped ${result.skipped.length} duplicate row${result.skipped.length === 1 ? '' : 's'}`)
      } else {
        toast.error(`Added ${result.added}; skipped ${result.skipped.length}; ${result.failures.length} row${result.failures.length === 1 ? '' : 's'} failed`)
      }
    } catch (error: unknown) {
      console.error('Error importing families from CSV:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import families from CSV')
    } finally {
      setImportingFamilies(false)
      if (familyCsvInput.current) familyCsvInput.current.value = ''
    }
  }

  const downloadFamilyCsvTemplate = () => {
    const blob = new Blob([`${familyCsvHeaders.join(',')}\r\n`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'family-import-template.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
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

      <section className="glass-card p-6 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Add Birds</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Upload a CSV with these columns: <code>{birdCsvHeaders.join(', ')}</code>.
              commonName and scientificName are required; familyId accepts a family ID or name.
              iucnStatus uses a code such as LC or VU and defaults to LC; isMigratory must be true or false
              and defaults to false. info is optional; quote values containing commas.
              commonCode and photoCount are generated automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 min-w-64">
            <button type="button" onClick={downloadBirdCsvTemplate} className="btn-secondary w-full flex justify-center gap-2">
              <Download className="h-5 w-5" />
              <span>Download Template</span>
            </button>
            <button
              type="button"
              onClick={() => birdCsvInput.current?.click()}
              disabled={importingBirds}
              className="btn-primary w-full flex justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              <span>{importingBirds ? 'Importing...' : 'Upload CSV'}</span>
            </button>
            <input
              ref={birdCsvInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={event => {
                const file = event.target.files?.[0]
                if (file) void handleBirdCsvUpload(file)
              }}
            />
          </div>
        </div>
        {csvImportResult && (
          <div aria-live="polite" className="text-sm text-slate-700 dark:text-slate-300">
            <p>Added {csvImportResult.added} bird{csvImportResult.added === 1 ? '' : 's'}.</p>
            {csvImportResult.skipped.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-amber-700 dark:text-amber-400">
                {csvImportResult.skipped.map(skipped => <li key={skipped}>{skipped}</li>)}
              </ul>
            )}
            {csvImportResult.failures.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-red-600 dark:text-red-400">
                {csvImportResult.failures.map(failure => <li key={failure}>{failure}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="glass-card p-6 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Add Families</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Upload a CSV with these columns: <code>{familyCsvHeaders.join(', ')}</code>.
              All fields are required; familyOf is a comma-separated list, and taxoPos must be a number.
              Quote familyOf when it contains commas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 max-w-64">
            <button type="button" onClick={downloadFamilyCsvTemplate} className="btn-secondary w-full flex justify-center gap-2">
              <Download className="h-5 w-5" />
              <span>Download Template</span>
            </button>
            <button
              type="button"
              onClick={() => familyCsvInput.current?.click()}
              disabled={importingFamilies}
              className="btn-primary w-full flex justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              <span>{importingFamilies ? 'Importing...' : 'Upload CSV'}</span>
            </button>
            <input
              ref={familyCsvInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={event => {
                const file = event.target.files?.[0]
                if (file) void handleFamilyCsvUpload(file)
              }}
            />
          </div>
        </div>
        {familyCsvImportResult && (
          <div aria-live="polite" className="text-sm text-slate-700 dark:text-slate-300">
            <p>Added {familyCsvImportResult.added} famil{familyCsvImportResult.added === 1 ? 'y' : 'ies'}.</p>
            {familyCsvImportResult.skipped.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-amber-700 dark:text-amber-400">
                {familyCsvImportResult.skipped.map(skipped => <li key={skipped}>{skipped}</li>)}
              </ul>
            )}
            {familyCsvImportResult.failures.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-red-600 dark:text-red-400">
                {familyCsvImportResult.failures.map(failure => <li key={failure}>{failure}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>

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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Photos Submitted</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Walks Attended</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">UserType</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">@{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{u.whatsapp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">{u.photoCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">{u.walkCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {u.userType ? (
                        <select
                          aria-label={`User type for ${u.username}`}
                          value={u.userType}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            if (value === 1 || value === 2) {
                              void handleUserTypeChange(u.uid, value)
                            }
                          }}
                          className="input-field py-1.5 text-sm"
                        >
                          {Object.entries(nonAdminUserTypes).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={'px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'}>
                          Admin
                        </span>
                      )}
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
