// Pastels only: the table body keeps green and orange for status, so an avatar
// never competes with them.
const AVATAR_COLORS = ['#f9bef9', '#76e5fd', '#fedf85']

/** $c-soft-black, for legible initials on the pastel fills. */
export const AVATAR_TEXT_COLOR = '#343440'

// Keyed on the user id so a member keeps their colour when a filter reorders the list.
export function avatarColor(userId: string): string {
  const hash = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
