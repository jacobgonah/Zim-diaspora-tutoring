export const QUALIFICATION_OPTIONS = [
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Diploma',
  'National Certificate',
] as const

export function qualificationChoices(selected: string[]) {
  const extras = selected.filter((item) => !QUALIFICATION_OPTIONS.includes(item as (typeof QUALIFICATION_OPTIONS)[number]))
  return [...QUALIFICATION_OPTIONS, ...extras]
}
