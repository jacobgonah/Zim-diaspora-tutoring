export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-neutral-100">
      <div className="mb-8 h-1 w-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600" aria-hidden="true" />
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Privacy Policy – Zim Diaspora Tutoring</h1>
      <p className="mt-2 border-b border-neutral-800 pb-6 text-sm text-neutral-500">Last updated: 26 October 2026</p>
      <p className="mt-6 leading-7 text-neutral-300">We collect as little personal information as possible.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Who we are</h2>
      <p className="mt-3 leading-7 text-neutral-300">Zim Diaspora Tutoring is a simple website that lists tutors (mainly in Zimbabwe) and lets diaspora parents book lesson times. Lessons and payments happen off the site.</p>
      <p className="mt-3 leading-7 text-neutral-300">The website is run by zimdiasporatutoring (trading as zimdiasporatutoring), [UK postal address]. We are the data controller for the personal information described here.</p>
      <p className="mt-3 leading-7 text-neutral-300">ICO registration number: [ICO registration number]</p>
      <p className="mt-3 leading-7 text-neutral-300">
        Contact for any privacy question or data request: <a href="mailto:contact@zimdiasporatutoring.co.uk" className="text-amber-400 underline underline-offset-4">contact@zimdiasporatutoring.co.uk</a>
      </p>

      <h2 className="mt-8 text-xl font-semibold text-white">Who can use the site</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Only parents or legal guardians aged 18 or over may create a parent account and book lessons.</li>
        <li>Tutors must be 18 or over.</li>
        <li>Children do not create accounts. A parent or guardian books for their child.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-white">What we collect</h2>
      <h3 className="mt-4 font-semibold text-white">Tutors</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>First name, surname and gender</li>
        <li>Email address</li>
        <li>Password (held by our sign-in service, Supabase Auth, and stored only in hashed form – we never see it)</li>
        <li>Phone number and WhatsApp number</li>
        <li>Subjects, levels, languages, qualifications held, description</li>
        <li>Availability (the lesson times you set)</li>
        <li>Optional: profile photo, introduction video, CV</li>
        <li>Online status and “Last seen” (shown publicly on the profile)</li>
        <li>No-show reports (shown publicly on the profile)</li>
      </ul>
      <h3 className="mt-6 font-semibold text-white">Parents</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>First name, surname, email address</li>
        <li>Password (held by our sign-in service and stored only in hashed form)</li>
        <li>Optional phone number</li>
        <li>Booking details (tutor, subject, level, date and time)</li>
      </ul>
      <h3 className="mt-6 font-semibold text-white">Children (learners)</h3>
      <p className="mt-3 leading-7 text-neutral-300">When a parent books a lesson, the booking may include details about the child (first name, age or school year group, level and subject, and learning needs only if the parent chooses to share them). Children’s details are never shown publicly. They can only be seen by the parent who made the booking and the tutor who accepts it.</p>
      <h3 className="mt-6 font-semibold text-white">Everyone</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Server logs (IP address, browser type, time of request)</li>
        <li>Cloudflare Web Analytics (anonymous page-view statistics – no cookies)</li>
        <li>Emails you send us</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-white">We do not collect</h2>
      <p className="mt-3 rounded-xl border border-red-500/40 bg-neutral-900 px-5 py-4 leading-7 text-neutral-300">ID photos, passports, face scans, biometric data, or criminal record information.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Why we collect it and our lawful basis</h2>
      <p className="mt-3 leading-7 text-neutral-300">We process data to provide the service you request (contract) and for our legitimate interests in running a simple, low-data tutoring directory, keeping the site secure, and showing which tutors are active.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">How we protect children’s data</h2>
      <p className="mt-3 leading-7 text-neutral-300">Children’s details are only visible to the parent who made the booking and the tutor who accepts it. They are never shown on public profiles or search results.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Who we share it with</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Supabase – database, sign-in and file storage (data stored in Ireland)</li>
        <li>Netlify – website hosting</li>
        <li>Cloudflare – domain, security and cookieless analytics</li>
        <li>Resend – confirmation and reminder emails</li>
        <li>The other party in a booking (WhatsApp number and relevant booking details only after acceptance)</li>
      </ul>
      <p className="mt-4 leading-7 text-neutral-300">We do not sell personal data.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">International transfers</h2>
      <p className="mt-3 leading-7 text-neutral-300">Most tutors are in Zimbabwe. When a parent books a Zimbabwe-based tutor, the necessary booking details are sent to that tutor. Some of our providers may process data outside the UK. Where this happens we rely on appropriate safeguards.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">How long we keep it</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-300 marker:text-amber-400">
        <li>Accounts: while active, or until you delete them. Inactive accounts may be deleted after 24 months following an email warning.</li>
        <li>Bookings: 12 months after the lesson date.</li>
        <li>Children’s booking details: deleted with the booking.</li>
        <li>No-show reports: 12 months.</li>
        <li>CVs, videos and photos: deleted within 30 days of removal or account deletion.</li>
        <li>Server logs: up to 30 days.</li>
      </ul>
      <p className="mt-4 leading-7 text-neutral-300">If the site closes, accounts and data will be deleted. You can request deletion at any time.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Your rights</h2>
      <p className="mt-3 leading-7 text-neutral-300">
        You have the right to access, correct, delete, restrict, or object to the use of your data, and to withdraw consent where we rely on it. Email us at <a href="mailto:contact@zimdiasporatutoring.co.uk" className="text-amber-400 underline underline-offset-4">contact@zimdiasporatutoring.co.uk</a>. We will reply within one month.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-white">Complaints</h2>
      <p className="mt-3 leading-7 text-neutral-300">
        Please contact us first. You can also complain to the ICO: <a href="https://ico.org.uk" className="text-amber-400 underline underline-offset-4">https://ico.org.uk</a> or 0303 123 1113.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-white">Cookies and analytics</h2>
      <p className="mt-3 leading-7 text-neutral-300">We do not use advertising or tracking cookies. Sign-in sessions are essential. We use Cloudflare Web Analytics, which does not use cookies.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Identity and safety</h2>
      <p className="mt-3 rounded-xl border border-amber-500/40 bg-neutral-900 px-5 py-4 leading-7 text-amber-100">We do not check identity or criminal records. Parents must make their own checks before booking or meeting a tutor.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Security</h2>
      <p className="mt-3 leading-7 text-neutral-300">We use encrypted connections (HTTPS), hashed passwords and restricted database access.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Changes</h2>
      <p className="mt-3 leading-7 text-neutral-300">We may update this policy. The date at the top will change when we do.</p>

      <h2 className="mt-8 text-xl font-semibold text-white">Contact</h2>
      <p className="mt-3 border-t border-neutral-800 pt-6 leading-7 text-neutral-300">
        <a href="mailto:contact@zimdiasporatutoring.co.uk" className="text-amber-400 underline underline-offset-4">contact@zimdiasporatutoring.co.uk</a>
      </p>
      <p className="mt-3 leading-7 text-neutral-300">zimdiasporatutoring (trading as zimdiasporatutoring), [UK postal address]</p>
    </div>
  )
}
