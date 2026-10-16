export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose">
      <h1>Privacy Policy</h1>
      <p>Last updated: October 2026</p>
      <p>We collect as little personal information as possible.</p>
      <ul>
        <li>Tutors: surname, subjects, levels, languages, held qualifications, description, optional profile photo, optional introduction video, optional CV, and an optional WhatsApp number. The WhatsApp number is not shown on the public listing. After the tutor accepts a booking, each person receives a WhatsApp link to the other saved number. This site does not host the conversation.</li>
        <li>Parents: first name, surname, email, a password held by the sign-in service, an optional phone number, and booking details.</li>
      </ul>
      <p><strong>We do not collect:</strong> ID photos, passports, face scans, biometric data, or criminal record information.</p>
      <p>We do not check identity or criminal records. Parents are responsible for their own checks before booking or meeting a tutor.</p>
      <p>If this website closes or the company is liquidated, all accounts and personal data will be securely deleted.</p>
      <p>Data is stored securely using Supabase. We use it only to run the directory and booking service.</p>
    </div>
  )
}
