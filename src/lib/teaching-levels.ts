export const TEACHING_LEVELS = [
  { value: 'Primary', label: 'Primary teacher' },
  { value: 'Secondary', label: 'Secondary teacher' },
  { value: 'High School', label: 'High school teacher' },
  { value: 'Advanced Level', label: 'Advanced level teacher' },
] as const

export function teachingLevelLabel(value: string): string {
  const match = TEACHING_LEVELS.find((level) => level.value === value)
  if (match) return match.label
  if (/teacher$/i.test(value.trim())) return value
  return `${value} teacher`
}
