import { TutorProfile } from './tutor-profile'

export const instant = false

export default async function TutorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TutorProfile id={id} />
}
