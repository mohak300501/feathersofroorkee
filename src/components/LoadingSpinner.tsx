import { Loader2 } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-black text-opacity-80 dark:text-slate-400 text-lg">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner 