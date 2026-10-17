/** Government IDs accepted for account verification (Philippines). */
export const ID_TYPES = [
  'PhilSys National ID',
  "Driver's License",
  'Passport',
  'UMID / SSS ID',
  'PhilHealth ID',
  "Voter's ID",
  'Postal ID',
  'PRC ID',
  'TIN ID',
  'Senior Citizen ID',
  'Student ID',
  'Other government ID',
] as const

/** Limit for selfies and ID photos; the server enforces the same. */
export const VERIFICATION_PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const VERIFICATION_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
