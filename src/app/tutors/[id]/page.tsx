import { supabase, PUBLIC_TUTOR_COLUMNS } from '@/lib/supabase'
import { teachingLevelLabel } from '@/lib/teaching-levels'
import { TutorPhoto } from '@/components/TutorPhoto'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const instant = false

export default async function TutorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: tutor } = await supabase
    .from('tutors')
    .select(PUBLIC_TUTOR_COLUMNS)
    .eq('id', id)
    .eq('is_live', true)
    .single()

  if (!tutor) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/tutors" className="text-zw-green hover:underline text-sm">← Back to tutors</Link>
      
      <div className="bg-white p-6 rounded-lg shadow mt-4 border-t-4 border-zw-green">
        <div className="flex items-start gap-4">
          <TutorPhoto
            photoUrl={tutor.photo_url}
            initial={tutor.surname?.[0] || '?'}
            alt=""
            className="h-24 w-24 shrink-0 rounded-full text-3xl"
          />
          <div>
            <h1 className="text-2xl font-bold">{tutor.title} {tutor.surname}</h1>
            <p className="text-zinc-500">{tutor.levels.map(teachingLevelLabel).join(' • ')}</p>
            {tutor.years_experience && <p className="text-sm">{tutor.years_experience} years experience</p>}
            {tutor.no_show_count > 0 && (
              <p className="text-red-600 text-sm mt-1">Reported no-shows: {tutor.no_show_count}</p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h2 className="font-semibold">Subjects</h2>
            <p>{tutor.subjects.join(', ')}</p>
          </div>
          <div>
            <h2 className="font-semibold">Languages</h2>
            <p>{tutor.languages.join(', ')}</p>
          </div>
          {tutor.qualifications && tutor.qualifications.length > 0 && (
            <div>
              <h2 className="font-semibold">Held qualifications</h2>
              <p>{tutor.qualifications.join(', ')}</p>
            </div>
          )}
          {tutor.description && (
            <div>
              <h2 className="font-semibold">About</h2>
              <p className="whitespace-pre-wrap">{tutor.description}</p>
            </div>
          )}
          {tutor.video_url && (
            <div>
              <h2 className="font-semibold">Introduction</h2>
              <video
                controls
                playsInline
                preload="metadata"
                src={tutor.video_url}
                className="mt-2 w-full max-w-md rounded-lg bg-black"
              />
            </div>
          )}
          <a
            href={`/tutors/${tutor.id}/book`}
            className="inline-block bg-zw-gold text-black px-6 py-2 rounded-lg font-medium"
          >
            Book a Time Slot
          </a>
        </div>

        <div className="mt-8 p-4 bg-zw-cream rounded text-sm border-l-4 border-zw-red">
          <p><strong>Booking:</strong> Sign in as a parent to request a time. The tutor accepts on this site, then WhatsApp opens so you can agree the details. This site does not host that chat.</p>
          <p className="mt-2">This platform does not handle lesson payments or verify identity.</p>
        </div>
      </div>
    </div>
  )
}
