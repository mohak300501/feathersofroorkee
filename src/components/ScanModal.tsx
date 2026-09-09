import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, X } from 'lucide-react'

interface Props {
  onClose: () => void
  onScanned: (payload: string) => Promise<void>
}

const ScanModal = ({ onClose, onScanned }: Props) => {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    let mounted = true
    const start = async () => {
      try {
        const scanner = new Html5Qrcode('binocular-qr-reader')
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decodedText) => {
            if (!mounted || !scanning) return
            setScanning(false)
            try {
              await scanner.stop()
            } catch {}
            await onScanned(decodedText)
          },
          () => {}
        )
      } catch (e: any) {
        if (mounted) setError(e.message || 'Could not access the camera. Check browser camera permissions.')
      }
    }
    start()

    return () => {
      mounted = false
      const scanner = scannerRef.current
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => {
          scanner.clear().catch(() => {})
        })
      }
    }
    // scanner starts only once for this modal instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Scan Binocular QR</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Point the camera at the QR sticker.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden bg-slate-950 min-h-[320px] flex items-center justify-center">
          <div id="binocular-qr-reader" className="w-full" />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <QrCode className="h-4 w-4" />
            Camera is active. Keep the QR code inside the frame.
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanModal
