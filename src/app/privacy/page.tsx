export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-neutral-100">
      <div className="mb-8 h-1 w-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600" aria-hidden="true" />
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Privacy Policy</h1>
      <p className="mt-2 border-b border-neutral-800 pb-6 text-sm text-neutral-500">Last updated: October 2026</p>
      <p className="mt-6 leading-7 text-neutral-300">We collect as little personal information as possible.</p>
      <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Tutors: surname, subjects, levels, languages, held qualifications, description, optional profile photo, optional introduction video, optional CV, and an optional WhatsApp number. The WhatsApp number is not shown on the public listing. After the tutor accepts a booking, each person receives a WhatsApp link to the other saved number. This site does not host the conversation.</li>
        <li>Parents: first name, surname, email, a password held by the sign-in service, an optional phone number, and booking details.</li>
      </ul>
      <p className="mt-6 rounded-xl border border-red-500/40 bg-neutral-900 px-5 py-4 leading-7 text-neutral-300"><strong className="text-white">We do not collect:</strong> ID photos, passports, face scans, biometric data, or criminal record information.</p>
      <p className="mt-4 rounded-xl border border-amber-500/40 bg-neutral-900 px-5 py-4 leading-7 text-amber-100">We do not check identity or criminal records. Parents are responsible for their own checks before booking or meeting a tutor.</p>
      <p className="leading-7 text-neutral-300 border-t border-neutral-800 pt-6 mt-6">If this website closes or the company is liquidated, all accounts and personal data will be securely deleted.</p>
      <p className="mt-4 leading-7 text-neutral-300">Data is stored securely using Supabase. We use it only to run the directory and booking service.</p>
    </div>
  )
}
