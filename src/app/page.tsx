import Link from "next/link";
import { ZimbabweFlag } from "@/components/ZimbabweFlag";

const STEPS = [
  {
    color: "border-zw-green",
    text: "Tutors create a free profile with subjects, levels (Primary, High School, Advanced Level), and languages.",
  },
  {
    color: "border-zw-gold",
    text: "Parents search and filter for free, then book a time slot.",
  },
  {
    color: "border-zw-red",
    text: "Confirmation and reminder emails are sent.",
  },
  {
    color: "border-black",
    text: "No-shows can be reported and show on profiles. After 3 tutor no-shows the profile is removed.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="bg-zw-green text-white overflow-x-clip">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div className="min-w-0">
            <p className="text-zw-gold text-sm font-semibold tracking-[0.16em] uppercase">
              For families at home and abroad
            </p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">
              Find Zimbabwean tutors for diaspora families
            </h1>
            <p className="mt-5 text-lg text-white/90 max-w-xl">
              A simple directory connecting tutors mainly in Zimbabwe with parents abroad.
              Search for tutors, view profiles, and book a lesson time.
              The actual lesson and payment happen directly between you and the tutor.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/tutors"
                className="bg-zw-gold text-black px-8 py-3 rounded-lg font-semibold text-center hover:bg-[#ffe566]"
              >
                Find a Tutor
              </Link>
              <Link
                href="/become-tutor"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold text-center hover:bg-white hover:text-zw-green"
              >
                List Yourself as a Tutor (Free)
              </Link>
            </div>
          </div>
          <div className="flex justify-center min-w-0">
            <ZimbabweFlag className="aspect-[2/1] h-auto w-full max-w-lg rounded-md shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-4 ring-white" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-zw-green">How it works</h2>
        <div className="mt-3 h-1.5 w-24 bg-zw-gold" />
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {STEPS.map((step) => (
            <li
              key={step.text}
              className={`bg-white rounded-lg border-l-4 ${step.color} px-5 py-4 text-sm text-zinc-700 shadow-sm`}
            >
              {step.text}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-zinc-600 max-w-3xl">
          We do not verify identity or run criminal checks. You must do your own due diligence.
        </p>
      </section>
    </div>
  );
}
