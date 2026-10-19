import Link from "next/link";
import { ShowUnlessTutor } from "@/components/SiteNav";
import { TEACHING_LEVELS } from "@/lib/teaching-levels";

const FORMULAS = [
  { f: "E = mc²", pos: "top-8 left-[4%]", c: "#FFD200", r: "-rotate-6" },
  { f: "a² + b² = c²", pos: "top-24 right-[5%]", c: "#34d399", r: "rotate-3" },
  { f: "H₂O", pos: "top-[45%] left-[2%]", c: "#ffffff", r: "rotate-6" },
  { f: "F = ma", pos: "bottom-10 left-[8%]", c: "#34d399", r: "-rotate-3" },
  { f: "x = (−b ± √(b² − 4ac)) / 2a", pos: "bottom-6 right-[4%]", c: "#FFD200", r: "rotate-2" },
  { f: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", pos: "top-4 left-1/2 -translate-x-1/2", c: "#ffffff", r: "" },
  { f: "∫ x dx = x²/2 + C", pos: "top-[40%] right-[2%]", c: "#ffffff", r: "-rotate-6" },
  { f: "PV = nRT", pos: "bottom-[30%] left-[14%]", c: "#FFD200", r: "rotate-12" },
  { f: "V = IR", pos: "bottom-[28%] right-[14%]", c: "#34d399", r: "-rotate-12" },
  { f: "π ≈ 3.14159", pos: "top-[22%] left-[18%]", c: "#34d399", r: "-rotate-12" },
  { f: "NaCl", pos: "top-[20%] right-[20%]", c: "#FFD200", r: "rotate-12" },
  { f: "sin²θ + cos²θ = 1", pos: "bottom-2 left-1/2 -translate-x-1/2", c: "#34d399", r: "" },
];

const STEPS = [
  {
    accent: "#006400",
    text: `Tutors create a free profile with subjects, levels (${TEACHING_LEVELS.map((level) => level.label).join(", ")}), and languages.`,
  },
  {
    accent: "#FFD200",
    text: "Parents search and filter for free, then book a time slot.",
  },
  {
    accent: "#D40000",
    text: "Confirmation and reminder emails are sent.",
  },
  {
    accent: "#FFFFFF",
    text: "No-shows can be reported and show on profiles. After 3 tutor no-shows the profile is removed.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-emerald-800 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-neutral-100">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          {FORMULAS.map((item) => (
            <span
              key={item.f}
              className={`absolute whitespace-nowrap font-mono text-xs italic opacity-30 sm:text-base md:text-lg md:opacity-40 ${item.pos} ${item.r}`}
              style={{ color: item.c }}
            >
              {item.f}
            </span>
          ))}
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-14 md:py-24">
          <div className="min-w-0 flex flex-col items-center text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-400" style={{ color: "#FFD200" }}>
              For families at home and abroad
            </p>
            <h1 className="mt-3 max-w-5xl text-3xl font-bold leading-tight text-white md:text-5xl" style={{ color: "#ffffff" }}>
              <span className="md:whitespace-nowrap">Empower Your Child&apos;s Learning With</span>
              <br className="hidden md:block" />{" "}
              <span className="md:whitespace-nowrap bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #34d399, #FFD200)", WebkitBackgroundClip: "text", color: "transparent" }}>
                Qualified Zimbabwean Tutors
              </span>
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-neutral-300" style={{ color: "#d4d4d4" }}>
              A simple directory connecting tutors mainly in Zimbabwe with parents abroad.
              Search for tutors, view profiles, and book a lesson time.
              The actual lesson and payment happen directly between you and the tutor.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/tutors"
                className="rounded-lg bg-amber-400 px-8 py-3 text-center font-bold text-neutral-950 transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ color: "#09090b" }}
              >
                Find a Tutor
              </Link>
              <ShowUnlessTutor>
                <Link
                  href="/tutor-signup"
                  className="rounded-lg border-2 border-white px-8 py-3 text-center font-semibold text-white transition-colors hover:border-amber-400 hover:text-amber-400"
                  style={{}}
                >
                  List Yourself as a Tutor (Free)
                </Link>
              </ShowUnlessTutor>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white" style={{ color: "#ffffff" }}>How it works</h2>
        <div className="mt-3 h-1.5 w-24 rounded-full bg-amber-400" style={{ backgroundColor: "#FFD200" }} />
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {STEPS.map((step) => (
            <li
              key={step.text}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 text-sm leading-6 text-neutral-300 shadow-lg shadow-black/30 transition-colors hover:border-neutral-700"
              style={{ borderLeftWidth: "4px", borderLeftColor: step.accent, backgroundColor: "#171717", color: "#d4d4d4" }}
            >
              {step.text}
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm text-neutral-400" style={{ color: "#a3a3a3" }}>
          We do not verify identity or run criminal checks. You must do your own due diligence.
        </p>
      </section>
    </div>
  );
}
