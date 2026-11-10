export const userTypes = {
  0: 'Admin',
  1: 'Member',
  2: 'User'
} as const

export type UserType = keyof typeof userTypes
