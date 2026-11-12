import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DEPT_MAP } from '../utils/dept_map'
import { User, Mail, Phone, Save, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { compressImage } from '../utils/imageCompressor'

const institutions = [
  'IITR Indian Institute of Technology Roorkee',
  'COER College of Engineering Roorkee',
  'CBRI Central Building Research Institute',
  'Other',
]

const designations = ['Student', 'Faculty', 'Staff', 'Other']
const statuses = ['Current', 'Former']
const years = [
  'PhD 8th', 'PhD 7th', 'PhD 6th', 'PhD 5th', 'PhD 4th', 'PhD 3rd', 'PhD 2nd', 'PhD 1st',
  'PG 2nd', 'PG 1st',
  'UG 5th', 'UG 4th', 'UG 3rd', 'UG 2nd', 'UG 1st',
  '12th', '11th', '10th', '9th', '8th', '7th', '6th', '5th', '4th', '3rd', '2nd', '1st'];
const professions = ['Artist', 'Doctor', 'Engineer', 'Business', 'Armed Forces', 'Other']
const genders = ['Male', 'Female', 'Other']

const Profile = () => {
  const { user, username: currentUsername, userPhoto: currentUserPhoto, whatsapp: currentWhatsapp, optionalInfo, updateProfile, updateUserPhoto } = useAuth()

  const [username, setUsername] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [userPhoto, setUserPhoto] = useState<string | null>(currentUserPhoto)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [institution, setInstitution] = useState('')
  const [designation, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [profession, setProfession] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')

  useEffect(() => {
    setUsername(currentUsername || '')
    setWhatsapp(currentWhatsapp || '')
  }, [currentUsername, currentWhatsapp])

  useEffect(() => {
    setUserPhoto(currentUserPhoto)
  }, [currentUserPhoto])

  useEffect(() => {
    setInstitution(optionalInfo.institution)
    setRole(optionalInfo.designation)
    setStatus(optionalInfo.status)
    setProfession(optionalInfo.designation === 'Other' ? optionalInfo.profession : '')
    setDepartment(optionalInfo.designation === 'Other' ? '' : optionalInfo.department)
    setYear(optionalInfo.designation === 'Student' ? optionalInfo.year : '')
    setAge(optionalInfo.age)
    setGender(optionalInfo.gender)
  }, [optionalInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters long")
      return
    }

    const phoneRegex = /^[0-9]{10}$/
    if (whatsapp && !phoneRegex.test(whatsapp)) {
      toast.error('Please enter a valid 10-digit WhatsApp number')
      return
    }

    setLoading(true)
    try {
      await updateProfile(username, whatsapp, {
        institution,
        designation,
        status,
        profession: designation === 'Other' ? profession : '',
        department: designation === 'Other' ? '' : department,
        year: designation === 'Student' ? year : '',
        age,
        gender
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (value: string) => {
    setRole(value)

    if (value === 'Other') {
      setDepartment('')
    } else {
      setProfession('')
    }
  }

  const handleAgeChange = (value: string) => {
    setAge(value.replace(/\D/g, ''))
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    event.target.value = ''

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image')
      return
    }

    setUploadingPhoto(true)
    try {
      const image = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, maxSizeMB: 3.5 })
      const token = await user.getIdToken()
      const response = await fetch('/api/General/addUserPhoto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(image)
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload profile photo')
      }
      setUserPhoto(data.userPhoto)
      updateUserPhoto(data.userPhoto)
      toast.success('Profile photo updated')
    } catch (error: unknown) {
      console.error('Error uploading profile photo:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="section-header">Your Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
        <aside className="glass rounded-2xl p-6 shadow-xl text-center md:sticky md:top-24 md:self-start">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Profile Photo</h2>
          <div className="w-40 h-40 mx-auto rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-lg">
            {userPhoto ? (
              <img
                src={userPhoto.startsWith('http') ? userPhoto : `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${userPhoto}`}
                alt="Your profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User className="w-16 h-16" />
              </div>
            )}
          </div>
          <label className={`btn-primary mt-6 inline-flex items-center gap-2 cursor-pointer ${uploadingPhoto ? 'opacity-60 pointer-events-none' : ''}`}>
            <Camera className="h-5 w-5" />
            <span>{uploadingPhoto ? 'Uploading...' : userPhoto ? 'Change Photo' : 'Upload Photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploadingPhoto}
              className="sr-only"
            />
          </label>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-6">
        <div id="account-details" className="glass rounded-2xl p-8 shadow-xl animate-fade-in scroll-mt-24">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Details</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Update your account details.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative opacity-75">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="input-field cursor-not-allowed pl-10"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Email address cannot be changed.</p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-field pl-10"
                placeholder="Choose a username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              WhatsApp Contact
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                id="whatsapp"
                type="text"
                value={whatsapp || ""}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter a 10-digit number"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Required for BirdWalk registration.</p>
          </div>

        </div>

        <div id="optional-info" className="glass rounded-2xl p-8 shadow-xl animate-fade-in scroll-mt-24">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Optional Info</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Updating this info will help us generate anonymous stats.<br />
              Rest assured, this info won't be displayed publicly.
            </p>
          </div>
          <div>
            <label htmlFor="institution" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Institution
            </label>
            <select
              id="institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="input-field"
            >
              <option value="">Select institution</option>
              {institutions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Designation
            </label>
            <select
              id="designation"
              value={designation}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="input-field"
            >
              <option value="">Select designation</option>
              {designations.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field"
            >
              <option value="">Select designation status</option>
              {statuses.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {designation === 'Other' ? (
            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Profession
              </label>
              <select
                id="profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="input-field"
              >
                <option value="">Select profession</option>
                {professions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Department
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input-field"
              >
                <option value="">Select department</option>
                {Object.entries(DEPT_MAP).map(([code, { dept }]) => (
                  <option key={code} value={code}>{code} {dept}</option>
                ))}
              </select>
            </div>
          )}

          {designation === 'Student' && status === 'Current' &&
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Year
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input-field"
              >
                <option value="">Select year of study</option>
                {years.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          }

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Age
            </label>
            <input
              id="age"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={age}
              onChange={(e) => handleAgeChange(e.target.value)}
              className="input-field"
              placeholder="Enter age"
              aria-label="Age"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="input-field"
            >
              <option value="">Select gender</option>
              {genders.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
        <aside className="glass rounded-2xl p-6 shadow-xl md:sticky md:top-24 md:self-start">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Sections</h2>
          <nav aria-label="Profile sections" className="space-y-2">
            <a href="#account-details" className="block rounded-lg px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors">
              Account Details
            </a>
            <a href="#optional-info" className="block rounded-lg px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors">
              Optional Info
            </a>
          </nav>
        </aside>
      </div>
    </div>
  )
}

export default Profile
