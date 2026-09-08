import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DEPT_MAP } from '../utils/dept_map'
import { User, Mail, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const institutions = [
  'IITR Indian Institute of Technology Roorkee',
  'COER College of Engineering Roorkee',
  'CBRI Central Building Research Institute',
  'Other',
]

const roles = ['Student', 'Faculty', 'Staff', 'Other']
const professions = ['Artist', 'Doctor', 'Engineer', 'Business', 'Armed Forces', 'Other']
const genders = ['Male', 'Female', 'Other']

const Profile = () => {
  const { user, username: currentUsername, optionalInfo, updateProfile } = useAuth()

  const [username, setUsername] = useState(currentUsername || "")
  const [loading, setLoading] = useState(false)

  const [institution, setInstitution] = useState('')
  const [role, setRole] = useState('')
  const [profession, setProfession] = useState('')
  const [department, setDepartment] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')

  useEffect(() => {
    setUsername(currentUsername || "")
  }, [currentUsername])

  useEffect(() => {
    setInstitution(optionalInfo.institution)
    setRole(optionalInfo.role)
    setProfession(optionalInfo.role === 'Other' ? optionalInfo.profession : '')
    setDepartment(optionalInfo.role === 'Other' ? '' : optionalInfo.department)
    setAge(optionalInfo.age)
    setGender(optionalInfo.gender)
  }, [optionalInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters long")
      return
    }

    setLoading(true)
    try {
      await updateProfile(username, {
        institution,
        role,
        profession: role === 'Other' ? profession : '',
        department: role === 'Other' ? '' : department,
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

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="section-header">Your Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-2xl p-8 shadow-xl animate-fade-in">
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
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl animate-fade-in">
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
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="input-field"
            >
              <option value="">Select role</option>
              {roles.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {role === 'Other' && (
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
          )}

          {role !== 'Other' && (
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
    </div>
  )
}

export default Profile
