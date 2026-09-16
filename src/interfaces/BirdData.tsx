export interface BirdData {
  id: string
  commonName: string
  scientificName: string
  photoCount: number
  iucnStatus: string
  isMigratory: boolean
  familyId?: string
  familyName?: string
  info?: string
}
