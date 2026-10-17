export const GENDERS = ['Male', 'Female'] as const
export type TutorGender = (typeof GENDERS)[number]

export function tutorGender(value: unknown): TutorGender | null {
  return value === 'Male' || value === 'Female' ? value : null
}
