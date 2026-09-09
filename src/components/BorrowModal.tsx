import { CheckCircle2, CircleSlash2, RotateCcw, X } from 'lucide-react'
import type { Binocular } from '../pages/Binoculars'

export interface ScannedBinocular extends Binocular {
  status: 'Available' | 'Borrowed' | 'Unavailable'
  currentTransactionId?: string | null
}

interface Props {
  binocular: ScannedBinocular
  onClose: () => void
  onBorrow: () => Promise<void>
  onReturn: () => Promise<void>
}

const BorrowModal = ({ binocular, onClose, onBorrow, onReturn }: Props) => {
  const available = binocular.status === 'Available'
  const borrowed = binocular.status === 'Borrowed'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-md p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Binocular Details</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Make</div>
            <div className="mt-1 font-semibold text-lg text-slate-900 dark:text-white">{binocular.make}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Physical ID</div>
            <div className="mt-1 font-semibold text-lg text-slate-900 dark:text-white">{binocular.physicalId}</div>
          </div>

          <div className={`rounded-xl p-4 ${
            available
              ? 'bg-emerald-50 dark:bg-emerald-900/20'
              : borrowed
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'bg-amber-50 dark:bg-amber-900/20'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {available ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : borrowed ? <RotateCcw className="h-5 w-5 text-blue-600" /> : <CircleSlash2 className="h-5 w-5 text-amber-600" />}
              <span>Status: {binocular.status}</span>
            </div>
          </div>

          {available && (
            <button onClick={onBorrow} className="btn-primary w-full">Borrow</button>
          )}
          {borrowed && (
            <button onClick={onReturn} className="btn-primary w-full">Return</button>
          )}
          {!available && !borrowed && (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
              This binocular is currently borrowed by another user.
            </div>
          )}

          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  )
}

export default BorrowModal
