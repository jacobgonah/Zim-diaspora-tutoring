import { TutorHeartbeat } from "@/components/TutorHeartbeat";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { ShowUnlessTutor, SiteNav } from "@/components/SiteNav";
import { FlagStripes } from "@/components/FlagStripes";
import { ZimbabweFlag } from "@/components/ZimbabweFlag";
import { CurrentYear } from "@/components/CurrentYear";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: "600",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zim Diaspora Tutoring",
  description: "Connect with tutors mainly in Zimbabwe. Book lesson times. Lessons and payments happen off the platform.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100" style={{ backgroundColor: "#09090b", color: "#f5f5f5" }}>
        <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 text-white backdrop-blur-md" style={{ backgroundColor: "rgba(9, 9, 11, 0.95)", color: "#ffffff" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <AccountMenu />
              <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
                <ZimbabweFlag className="h-8 w-16 shrink-0 rounded-sm shadow-sm ring-1 ring-white/20 sm:h-10 sm:w-20" />
                <span className="min-w-0">
                  <span className={`${poppins.className} block truncate text-base sm:text-xl leading-tight text-white`} style={{ color: "#ffffff", fontWeight: 600 }}>
                    Zim Diaspora Tutoring
                  </span>
                  <span className="hidden text-xs text-neutral-400 sm:block" style={{ color: "#a3a3a3" }}>
                    Connecting learners and educators globally
                  </span>
                </span>
                <img
                  src="/zdt-logo.png"
                  alt="ZDT"
                  className="hidden h-11 w-auto shrink-0 sm:block"
                />
              </Link>
            </div>
            <SiteNav />
          </div>
          <FlagStripes className="h-1.5" />
        </header>
        <main className="flex-1 bg-neutral-950 text-neutral-100" style={{ backgroundColor: "#09090b", color: "#f5f5f5" }}>{children}</main>
        <footer className="border-t border-neutral-800 bg-neutral-900 text-neutral-300" style={{ backgroundColor: "#171717", color: "#d4d4d4" }}>
          <FlagStripes className="h-1.5" />
          <div className="max-w-3xl mx-auto px-4 py-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <ZimbabweFlag className="h-5 w-10 rounded-sm ring-1 ring-white/20" />
              <p className="text-sm font-semibold text-white" style={{ color: "#ffffff" }}>Zim Diaspora Tutoring</p>
            </div>
            <p className="text-xs leading-5 text-neutral-400" style={{ color: "#a3a3a3" }}>Connecting diaspora families with tutors mainly in Zimbabwe. Lessons and payments happen off this site.</p>
            <p className="mx-auto mt-4 max-w-xl rounded-xl border border-amber-500/40 bg-neutral-950 px-3 py-3 text-xs leading-5 text-amber-200/90" style={{ backgroundColor: "#09090b", color: "rgba(253, 230, 138, 0.9)", borderColor: "rgba(245, 158, 11, 0.4)" }}>
              This is a listings and booking site only. We do not check identity or criminal records. Parents must make their own checks. Lessons and payments happen off-platform.
            </p>
            <nav className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-neutral-300" style={{ color: "#d4d4d4" }}>
              <Link href="/contact" className="hover:underline">Contact Us</Link>
          {" · "}
          <Link href="/privacy" className="underline decoration-neutral-600 underline-offset-4 transition-colors hover:text-amber-400" style={{}}>Privacy Policy</Link>
              <Link href="/terms" className="underline decoration-neutral-600 underline-offset-4 transition-colors hover:text-amber-400" style={{}}>Terms</Link>
            </nav>
            <p className="mt-6 text-[11px] text-neutral-500" style={{ color: "#737373" }}>&copy; <CurrentYear /> Zim Diaspora Tutoring.</p>
          </div>
        </footer>
        <TutorHeartbeat />
      </body>
    </html>
  );
}


