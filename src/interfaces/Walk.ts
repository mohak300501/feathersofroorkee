export interface Walk {
  _id: string
  walkCode: string
  title?: string
  info: string
  datetime: string
  location: string
  mapPin?: string
  participantCount: number
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
  experience?: string
  userId?: string
  username?: string
  addedAt?: string
}

export interface WalkDetail extends Walk {
  walkPhotos: WalkPhoto[]
}

export interface WalkRegistrationData {
  walkId: string
  members: number
}

