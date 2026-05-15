export function isValidAvatarUrl(value: string): boolean {
  const norm = value.trim().toLowerCase()
  return norm.startsWith('data:image/') || norm.startsWith('http://') || norm.startsWith('https://')
}
