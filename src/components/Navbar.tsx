import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Bird, LogIn, UserPlus, User, Settings, LogOut, Menu, X, Sun, Moon, Trophy, ListChecks, Binoculars } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user, isAdmin, username, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-bird-500 rounded-xl shadow-lg group-hover:shadow-primary-500/50 transition-all duration-300 transform group-hover:scale-105">
              <Bird className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-bird-500 dark:from-primary-400 dark:to-bird-400 tracking-tight">Feathers of Roorkee</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">

            <Link
              to="/leaderboard"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/leaderboard'
                ? 'text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Leaderboard</span>
            </Link>

            <Link
              to="/binoculars"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/binoculars'
                ? 'text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Binoculars className="h-4 w-4" />
              <span>Binoculars</span>
            </Link>

            <Link
              to="/checklist"
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/checklist'
                ? 'text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <ListChecks className="h-4 w-4" />
              <span>Checklist</span>
            </Link>

            {user && isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/admin'
                  ? 'text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-yellow-400" />}
            </button>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-700">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <User className="h-4 w-4 shrink-0" />
                  <span>Welcome,</span>
                  <span className="text-primary-600 dark:text-primary-400 font-semibold truncate max-w-[120px]">{username || user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary text-sm flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-yellow-400" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 rounded-xl mt-2 mb-4 overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">

              <Link
                to="/leaderboard"
                className={`flex items-center space-x-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/leaderboard'
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trophy className="h-5 w-5" />
                <span>Leaderboard</span>
              </Link>

              <Link
                to="/checklist"
                className={`flex items-center space-x-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/checklist'
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ListChecks className="h-5 w-5" />
                <span>Checklist</span>
              </Link>

              {user && isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/admin'
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}

              {user ? (
                <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 py-2.5 text-sm text-slate-600 dark:text-slate-300 mb-3 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <User className="h-5 w-5" />
                    <span>Welcome,</span><span className="font-semibold text-slate-900 dark:text-white ml-1">{username || user.email}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 p-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar