import { Github, ExternalLink, Dna, Bird, Camera, Users, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [stats, setStats] = useState({ totalFamilies: 0, totalBirds: 0, totalPhotos: 0, totalUsers: 0, totalVisits: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/General/publicStats')
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalFamilies: data.totalFamilies,
            totalBirds: data.totalBirds,
            totalPhotos: data.totalPhotos,
            totalUsers: data.totalUsers,
            totalVisits: data.totalVisits
          })
        }
      } catch (e) {
        // fail silently
      }
    }
    fetchStats()
  }, [])

  return (
    <footer className="bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 mt-auto backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4 py-6">
        {/* System Stats */}
        <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8 mb-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Dna className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <b className="text-slate-800 dark:text-slate-200">{stats.totalFamilies}</b>&nbsp;Families
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Bird className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <b className="text-slate-800 dark:text-slate-200">{stats.totalBirds}</b>&nbsp;Birds
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Camera className="h-5 w-5 text-bird-500 dark:text-bird-400" />
            <b className="text-slate-800 dark:text-slate-200">{stats.totalPhotos}</b>&nbsp;Photos
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <b className="text-slate-800 dark:text-slate-200">{stats.totalUsers}</b>&nbsp;Users
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <b className="text-slate-800 dark:text-slate-200">{stats.totalVisits}</b>&nbsp;Visits
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 w-full border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Copyright */}
          <div className="text-sm text-slate-500 dark:text-slate-400">
            © {currentYear} Mohak Ketan Patil
          </div>
          {/* Links */}
          <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6">
            <Link
              to="/about"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              About
            </Link>
            <Link
              to="/author"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Author
            </Link>
            <Link
              to="/guidelines"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Guidelines
            </Link>
            <Link
              to="/terms"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Terms & Conditions
            </Link>
            <a
              href="https://github.com/mohak300501/feathersofroorkee"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://ccf.iitr.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>IITR CCF</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
