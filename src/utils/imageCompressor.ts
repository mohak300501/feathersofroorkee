/**
 * Client-side image compression and safe API response handling utility.
 * Prevents "Stream body too big" (HTTP 413) and CORS issues with serverless functions
 * by resizing and compressing large photos before converting to base64.
 */

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

export interface CompressedImageResult {
  fileData: string // Base64 data without prefix (ready for backend)
  fileName: string
  contentType: string
  fileSize: number
}

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Ensures the file is appropriately sized for serverless upload payloads.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.82,
    maxSizeMB = 3.5
  } = options

  // Non-image files or SVG/GIF: read directly
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${maxSizeMB}MB.`)
    }
    const base64 = await readFileAsBase64(file)
    return {
      fileData: base64,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl)

      try {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas 2D context is not available')
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Try compressing with decreasing quality if still over maxSizeMB
        let currentQuality = quality
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality)
        let base64 = dataUrl.split(',')[1]

        const maxBase64Length = Math.floor(maxSizeMB * 1024 * 1024 * (4 / 3))

        while (base64.length > maxBase64Length && currentQuality > 0.4) {
          currentQuality -= 0.12
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality)
          base64 = dataUrl.split(',')[1]
        }

        // Normalize filename extension to .jpg since canvas exported image/jpeg
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const fileName = `${baseName}.jpg`

        resolve({
          fileData: base64,
          fileName,
          contentType: 'image/jpeg',
          fileSize: Math.round((base64.length * 3) / 4)
        })
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // Fallback to reading file directly
      readFileAsBase64(file)
        .then(base64 => {
          resolve({
            fileData: base64,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size
          })
        })
        .catch(reject)
    }

    img.src = objectUrl
  })
}

/**
 * Reads a File as base64 string (without the data:image/... prefix).
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1] || ''
        resolve(base64)
      } else {
        reject(new Error('Failed to read file as string'))
      }
    }
    reader.onerror = () => reject(reader.error || new Error('Error reading file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Safely parses an API response, handling non-JSON error pages, 413 Stream body too big,
 * and extracting human-readable error messages without throwing JSON.parse SyntaxErrors.
 */
export async function parseApiResponse<T = Record<string, unknown>>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (response.ok) {
    if (isJson) {
      return response.json()
    }
    return { success: true }
  }

  // Handle error statuses
  if (response.status === 413) {
    throw new Error('Photo payload is too large. Please enable the "Compress image" toggle and try again.')
  }

  let errorMessage = ''
  if (isJson) {
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.details || errorData.message || ''
    } catch {
      // Fall through to text
    }
  }

  if (!errorMessage) {
    try {
      const text = await response.text()
      if (text.includes('Stream body too big') || text.includes('Payload Too Large')) {
        errorMessage = 'Photo payload is too large. Please enable the "Compress image" toggle and try again.'
      } else if (text.length > 0 && text.length < 200 && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
        errorMessage = text
      }
    } catch {
      // Ignore text read error
    }
  }

  if (!errorMessage) {
    errorMessage = `Request failed with status ${response.status} (${response.statusText || 'Error'})`
  }

  throw new Error(errorMessage)
}

/**
 * Checks if an error is caused by payload size / stream limit exceeding limits.
 */
export function isSizeLimitError(error: unknown): boolean {
  if (!error) return false
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()
  return (
    lower.includes('too large') ||
    lower.includes('stream body too big') ||
    lower.includes('payload too large') ||
    lower.includes('size limit') ||
    lower.includes('413') ||
    lower.includes('network error')
  )
}
