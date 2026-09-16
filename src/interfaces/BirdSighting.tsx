export interface BirdSighting {
  id: string
  sightingId: string
  birdId: string
  photoId: string
  userId: string
  username: string
  mapCoords: [number, number]
  location: string
  info: string
  datetimeOfSighting: Date
  addedAt: Date
}

export interface SightingFormData {
  location: string
  mapCoords: [number, number] | null
  info: string
  dateOfSighting: string
  timeOfSighting: string
}
