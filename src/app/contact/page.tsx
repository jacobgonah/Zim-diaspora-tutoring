import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-zinc-600 mb-6">
        Have a question or need help? Send us an email and we&apos;ll get back to you.
      </p>
      <a
        href="mailto:contact@zimdiasporatutoring.co.uk"
        className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
      >
        contact@zimdiasporatutoring.co.uk
      </a>
      <p className="mt-8 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">&larr; Back to home</Link>
      </p>
    </div>
  )
}