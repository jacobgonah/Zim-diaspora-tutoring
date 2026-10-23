export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-neutral-100">
      <div className="mb-8 h-1 w-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600" aria-hidden="true" />
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Privacy Policy – Zim Diaspora Tutoring</h1>
      <p className="mt-2 border-b border-neutral-800 pb-6 text-sm text-neutral-500">Last updated: 23 October 2026</p>
      <p className="mt-6 leading-7 text-neutral-300">We collect as little personal information as possible.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Who we are</h2>
      <p className="mt-3 leading-7 text-neutral-300">
        Zim Diaspora Tutoring is a simple website that lists tutors (mainly in Zimbabwe) and lets diaspora parents book lesson times. Lessons and payments happen off the site. Contact: <a href="mailto:contact@zimdiasporatutoring.co.uk" className="text-amber-400 underline underline-offset-4">contact@zimdiasporatutoring.co.uk</a>
      </p>

      <h2 className="mt-8 text-xl font-semibold text-white">What we collect</h2>
      <h3 className="mt-4 font-semibold text-white">Tutors</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Surname, subjects, levels, languages, qualifications held, description</li>
        <li>Optional: profile photo, introduction video, CV, WhatsApp number</li>
      </ul>
      <h3 className="mt-6 font-semibold text-white">Parents</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>First name, surname, email address</li>
        <li>Password (held by our sign-in service)</li>
        <li>Optional phone number</li>
        <li>Booking details</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-white">We do not collect</h2>
      <p className="mt-3 rounded-xl border border-red-500/40 bg-neutral-900 px-5 py-4 leading-7 text-neutral-300">ID photos, passports, face scans, biometric data, or criminal record information.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Why we collect it</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>To create and show tutor profiles</li>
        <li>To let parents search and book a time slot</li>
        <li>To send confirmation and reminder emails</li>
        <li>To let tutor and parent exchange WhatsApp numbers only after a booking is accepted (we do not host the conversation)</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-white">Lawful basis</h2>
      <p className="mt-3 leading-7 text-neutral-300">We process this data to provide the service you request (contract) and for our legitimate interest in running a simple, low-data tutoring directory.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">How long we keep it</h2>
      <p className="mt-3 leading-7 text-neutral-300">We keep data while your account is active. If the site closes, accounts and data will be deleted. You can also request deletion at any time.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Who we share it with</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Our database and hosting providers (e.g. Supabase)</li>
        <li>Email service (e.g. Resend) for confirmation and reminder emails</li>
        <li>The other party in a booking (WhatsApp number only, after acceptance)</li>
      </ul>
      <p className="mt-4 leading-7 text-neutral-300">We do not sell personal data.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Your rights</h2>
      <p className="mt-3 leading-7 text-neutral-300">
        You can ask to access, correct, or delete your data, or object to processing. Email us at <a href="mailto:contact@zimdiasporatutoring.co.uk" className="text-amber-400 underline underline-offset-4">contact@zimdiasporatutoring.co.uk</a>.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-white">Identity and safety</h2>
      <p className="mt-3 rounded-xl border border-amber-500/40 bg-neutral-900 px-5 py-4 leading-7 text-amber-100">We do not check identity or criminal records. Parents must make their own checks before booking or meeting a tutor.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">International transfers</h2>
      <p className="mt-3 leading-7 text-neutral-300">Some of our providers may process data outside the UK. Where this happens, we rely on appropriate safeguards (such as standard contractual clauses).</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Changes</h2>
      <p className="mt-3 border-t border-neutral-800 pt-6 leading-7 text-neutral-300">We may update this policy. The date at the top will change when we do.</p>
    </div>
  )
}
