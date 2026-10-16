import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { GraduationCap, Search, UserPlus } from "lucide-react";
import { AuthMenu } from "@/components/AuthMenu";
import { FlagStripes } from "@/components/FlagStripes";
import { ZimbabweFlag } from "@/components/ZimbabweFlag";

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
  colorScheme: "only light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zw-cream text-zinc-900" style={{ backgroundColor: "#f7f4ea", color: "#1a1a1a" }}>
        <header className="bg-white text-zinc-900 shadow-sm" style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}>
          <FlagStripes className="h-2.5" />
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <ZimbabweFlag className="h-10 w-20 shrink-0 rounded-sm shadow-sm ring-1 ring-black/15" />
              <span className={`${poppins.className} text-lg sm:text-xl text-zw-green leading-tight`} style={{ color: "#006400", fontWeight: 600 }}>
                Zim Diaspora Tutoring
              </span>
              <img
                src="/zdt-logo.png"
                alt="ZDT"
                className="h-11 w-auto shrink-0"
              />
            </Link>
            <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <Link href="/tutors" className="inline-flex items-center gap-1.5 font-bold text-zw-green" style={{ color: "#006400" }}>
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                Find Tutors
              </Link>
              <Link href="/become-tutor" className="inline-flex items-center gap-1.5 font-bold text-zw-green" style={{ color: "#006400" }}>
                <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
                Become a Tutor
              </Link>
              <Link href="/parent-signup" className="inline-flex items-center gap-1.5 font-bold text-zw-green" style={{ color: "#006400" }}>
                <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                Parent Sign Up
              </Link>
              <AuthMenu />
            </nav>
          </div>
        </header>
        <main className="flex-1" style={{ backgroundColor: "#f7f4ea", color: "#1a1a1a" }}>{children}</main>
        <footer className="bg-zw-green text-white" style={{ backgroundColor: "#006400", color: "#ffffff" }}>
          <FlagStripes className="h-1" />
          <div className="max-w-3xl mx-auto px-4 py-4 text-center">
            <ZimbabweFlag className="mx-auto mb-2 h-5 w-10 rounded-sm ring-1 ring-white/30" />
            <p className="text-xs leading-5" style={{ color: "rgba(255, 255, 255, 0.72)" }}>This is a listings and booking site only. We do not check identity or criminal records. Parents must make their own checks. Lessons and payments happen off-platform.</p>
            <nav className="mt-2 flex justify-center gap-4 text-xs" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
              <Link href="/privacy" className="underline" style={{ color: "rgba(255, 255, 255, 0.85)" }}>Privacy Policy</Link>
              <Link href="/terms" className="underline" style={{ color: "rgba(255, 255, 255, 0.85)" }}>Terms</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
