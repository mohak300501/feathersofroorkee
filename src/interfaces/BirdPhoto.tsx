export interface BirdPhoto {
  id: string
  location: string
  imagekitFilePath: string
  imagekitFileId: string
  driveFileId: string
  userId: string
  username: string
  hearts: number
  hasHearted?: boolean
  sighting?: BirdSightingSummary
}

export interface BirdSightingSummary {
  id: string
  photoId: string
  userId: string
  username: string
  mapCoords: [number, number]
  location: string
  info: string
  datetimeOfSighting: string | Date
  addedAt: string | Date
}
