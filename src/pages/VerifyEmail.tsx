
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Bird, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const VerifyEmail = () => {
  const location = useLocation()

  const [email, setEmail] = useState(
    location.state?.email || ''
  )
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { resendVerificationEmail } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      await resendVerificationEmail(email, password)
      setPassword('')

    } catch (error) {
      console.error('Verification email error:', error)

      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to resend verification email.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div className="max-w-md w-full space-y-8 animate-fade-in">

        <div className="text-center">
          <div className="flex justify-center">
            <Bird className="h-12 w-12 text-primary-600" />
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
            Verify Your Email
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your account credentials to receive a new email verification link.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">

          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <span>Resend Verification Link</span>
              )}
            </button>

          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already verified your email?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Login here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
