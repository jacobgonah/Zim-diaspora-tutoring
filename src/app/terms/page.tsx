import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-neutral-100">
      <div className="mb-8 h-1 w-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600" aria-hidden="true" />
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Terms of Service – Zim Diaspora Tutoring</h1>
      <p className="mt-2 border-b border-neutral-800 pb-6 text-sm text-neutral-500">Last updated: 26 October 2026</p>
      <p className="mt-6 leading-7 text-neutral-300">
        These terms apply to everyone who uses zimdiasporatutoring.co.uk. The site is run by zimdiasporatutoring (trading as zimdiasporatutoring), [UK postal address]. Please also read our <Link href="/privacy" className="text-amber-400 underline underline-offset-4">Privacy Policy</Link>.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-white">What this site is</h2>
      <p className="mt-3 leading-7 text-neutral-300">This website is a simple listings and booking directory. It is <strong className="text-white">not</strong> a tutoring agency or employer. We do not employ tutors, and we do not check identity, qualifications or criminal records. Parents must make their own checks.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Who can use it</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Tutors must be 18 or over.</li>
        <li>Only parents or legal guardians aged 18 or over may create a parent account and book lessons.</li>
        <li>Children do not create accounts.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-white">Your account</h2>
      <p className="mt-3 leading-7 text-neutral-300">Give accurate information and keep your password safe. One person per account.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Acceptable use</h2>
      <p className="mt-3 leading-7 text-neutral-300">You must not post false information, anything illegal or abusive, use someone else’s photo or details without permission, spam, or try to break the site.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Safeguarding</h2>
      <p className="mt-3 rounded-xl border border-amber-500/40 bg-neutral-900 px-5 py-4 leading-7 text-amber-100">We do not check DBS or criminal records. Tutors must only teach when the parent is present or aware, must not contact children privately outside the agreed channel, and must report concerns to the parent and to us.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Bookings and payments</h2>
      <p className="mt-3 rounded-xl border border-red-500/40 bg-neutral-900 px-5 py-4 leading-7 text-neutral-100">Parents book a time slot on the site. Lessons and all payments happen off this platform, directly between parent and tutor. We do not handle refunds.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">No-shows</h2>
      <p className="mt-3 leading-7 text-neutral-300">No-shows can be reported and appear on both profiles. After 3 reported tutor no-shows the tutor profile is removed automatically.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Fees</h2>
      <p className="mt-3 leading-7 text-neutral-300">At launch, tutor profiles are free. A one-off listing fee may be introduced later.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Removal</h2>
      <p className="mt-3 leading-7 text-neutral-300">We may remove content or close accounts that break these terms or put a child at risk. You can delete your account at any time.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Your content</h2>
      <p className="mt-3 leading-7 text-neutral-300">You keep ownership of what you upload and allow us to show it while your profile is live.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Liability</h2>
      <p className="mt-3 leading-7 text-neutral-300">The site is provided free and “as is”. We are not responsible for lessons, payments or dealings between parents and tutors, except where the law does not allow us to limit liability.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Law</h2>
      <p className="mt-3 leading-7 text-neutral-300">These terms are governed by the law of England and Wales.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Contact</h2>
      <p className="mt-3 border-t border-neutral-800 pt-6 leading-7 text-neutral-300">
        <a href="mailto:contact@zimdiasporatutoring.co.uk" className="text-amber-400 underline underline-offset-4">contact@zimdiasporatutoring.co.uk</a>
      </p>
      <p className="mt-6 leading-7 text-neutral-300">By creating an account you agree to the Terms and Privacy Policy.</p>
    </div>
  )
}
