export interface Walk {
  _id: string
  walkCode: string
  title?: string
  info: string
  datetime: string
  location: string
  mapPin?: string
  bookedSlots: number
  limit?: number
  featuredPhoto?: string
  addedBy?: string
  addedAt?: string
}

export interface WalkPhoto {
  _id: string
  walkId: string
  imagekitFileId?: string
  imagekitFilePath?: string
  driveFileId?: string
  info?: string
  userId?: string
  username?: string
  addedAt?: string
}

export interface WalkExperience {
  id: string
  userId: string
  walkId: string
  info: string
  username: string
  addedAt: string
}

export interface WalkDetail extends Walk {
  walkPhotos: WalkPhoto[]
  walkExperiences: WalkExperience[]
}

export interface WalkRegistrationData {
  walkId: string
  slots: number
}
