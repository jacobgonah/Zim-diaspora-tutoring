"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  AUTH_NEXT_KEY,
  AUTH_ROLE_KEY,
  type AuthRole,
  destinationFor,
  parseRole,
  safeNext,
} from "@/lib/auth-redirect";
import { useTutorSession } from "@/lib/use-tutor-session";
import { FlagStripes } from "@/components/FlagStripes";

const fieldStyle = {
  backgroundColor: "#09090b",
  color: "#f5f5f5",
  WebkitTextFillColor: "#f5f5f5",
  forcedColorAdjust: "none" as const,
  colorScheme: "dark" as const,
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "0.875rem",
  fontWeight: 600,
  backgroundColor: "transparent",
  color: "#d4d4d4",
  WebkitTextFillColor: "#d4d4d4",
  forcedColorAdjust: "none" as const,
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<AuthRole>(parseRole(searchParams.get("role")));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ready: viewerReady, isTutor, userId } = useTutorSession();

  const next = safeNext(searchParams.get("next"));

  useEffect(() => {
    if (viewerReady && isTutor) router.replace("/profile");
  }, [viewerReady, isTutor, router]);

  function rememberChoice() {
    sessionStorage.setItem(AUTH_ROLE_KEY, role);
    if (next) sessionStorage.setItem(AUTH_NEXT_KEY, next);
    else sessionStorage.removeItem(AUTH_NEXT_KEY);
  }

  async function signInWithPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    rememberChoice();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace(destinationFor(role, next));
  }

  function roleButtonStyle(selected: boolean) {
    return selected
      ? { backgroundColor: "#022c22", color: "#6ee7b7", borderColor: "#065f46" }
      : { backgroundColor: "#171717", color: "#d4d4d4", borderColor: "#262626" };
  }

  const signupHref = role === "tutor"
    ? (next ? `/tutor-signup?next=${encodeURIComponent(next)}` : "/tutor-signup")
    : (next ? `/parent-signup?next=${encodeURIComponent(next)}` : "/parent-signup");

  if (!viewerReady) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: "#f5f5f5" }}>Loading sign-in...</p>;
  }

  if (isTutor) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: "#f5f5f5" }}>Opening your profile...</p>;
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12" style={{ color: "#f5f5f5" }}>
      <FlagStripes className="mx-auto mb-6 h-4 w-24 overflow-hidden rounded-sm ring-1 ring-white/20" />
      <h1 className="text-center text-3xl font-bold tracking-tight" style={{ color: "#ffffff" }}>Log in</h1>
      <div className="mx-auto mt-3 mb-4 h-1.5 w-20 rounded-full bg-amber-400" style={{ backgroundColor: "#FFD200" }} />
      <p className="mb-6 text-center leading-relaxed" style={{ color: "#d4d4d4" }}>
        {role === "tutor"
          ? "Tutors sign in with the email and password from Tutor Sign Up."
          : "Parents sign in with the email and password from Parent Sign Up."}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
        {(["parent", "tutor"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => {
              setRole(choice);
              setError(null);
            }}
            className="rounded-lg border px-3 py-2 text-sm font-semibold transition-colors hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={roleButtonStyle(role === choice)}
          >
            {choice === "parent" ? "I am a parent" : "I am a tutor"}
          </button>
        ))}
      </div>

      <form
        onSubmit={signInWithPassword}
        className="space-y-5 rounded-xl border border-neutral-800 border-t-4 border-t-amber-400 bg-neutral-900 p-6 shadow-2xl shadow-black/50 sm:p-8"
        style={{ backgroundColor: "#171717", color: "#f5f5f5", borderTop: "4px solid #FFD200" }}
      >
        <div>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={fieldStyle}
          />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={fieldStyle}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-400 py-3.5 text-lg font-bold text-neutral-950 shadow-lg shadow-amber-400/10 transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50"
          style={{ color: "#09090b" }}
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
        {viewerReady && !isTutor && !(userId && role === "tutor") && (
          <p className="text-center text-sm" style={{ color: "#a3a3a3" }}>
            {role === "tutor" ? "New tutor? " : "New parent? "}
            <Link href={signupHref} className="font-semibold text-amber-400 underline underline-offset-4 transition-colors hover:text-amber-300" style={{}}>
              {role === "tutor" ? "Tutor Sign Up" : "Parent Sign Up"}
            </Link>
          </p>
        )}
      </form>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="max-w-md mx-auto px-4 py-16" style={{ color: "#f5f5f5" }}>Loading sign-in...</p>}>
      <LoginForm />
    </Suspense>
  );
}
