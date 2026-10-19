export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-neutral-100">
      <div className="mb-8 h-1 w-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600" aria-hidden="true" />
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Terms of Service</h1>
      <p className="mt-2 border-b border-neutral-800 pb-6 text-sm text-neutral-500">Last updated: October 2026</p>
      <p className="mt-6 leading-7 text-neutral-300">This website is a simple listings and booking directory. It is <strong className="text-white">not</strong> a tutoring agency or employer.</p>
      <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>We do not employ tutors.</li>
        <li className="-ml-6 list-none rounded-xl border border-amber-500/40 bg-neutral-900 px-5 py-3 text-amber-100">We do not check identity, qualifications, or criminal records.</li>
        <li className="-ml-6 list-none rounded-xl border border-amber-500/40 bg-neutral-900 px-5 py-3 text-amber-100">Parents must make their own checks before using a tutor.</li>
        <li className="-ml-6 list-none rounded-xl border border-red-500/40 bg-neutral-900 px-5 py-3 text-neutral-100">Lessons and all payments for lessons happen off this platform, directly between parent and tutor.</li>
        <li>At launch, tutor profiles are free. A one-off listing fee may be introduced later.</li>
        <li>No-shows can be reported and will appear on both profiles. After 3 reported tutor no-shows, the tutor profile is removed automatically.</li>
        <li>If this site closes, accounts and data will be deleted.</li>
      </ul>
      <p className="mt-6 border-t border-neutral-800 pt-6 leading-7 text-neutral-300">By using this site you agree that you understand these limitations.</p>
    </div>
  )
}
