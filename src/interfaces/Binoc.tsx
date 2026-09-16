export interface Binocular {
  binocId: string
  make: string
  physicalId: string
  addedAt: string
  hash: string
}

export interface InventoryRow {
  make: string
  available: number
  total: number
}

export interface TransactionRow {
  transactionId: string
  binocId: string
  username: string
  physicalId: string
  borrowedAt: string
  returnedAt: string | null
}
