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

const fieldStyle = {
  backgroundColor: "#ffffff",
  color: "#111111",
  WebkitTextFillColor: "#111111",
  forcedColorAdjust: "none" as const,
  colorScheme: "light only" as const,
};

const labelStyle = {
  display: "block",
  marginBottom: "4px",
  backgroundColor: "#ffffff",
  color: "#111111",
  WebkitTextFillColor: "#111111",
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
  const { ready: viewerReady, isTutor } = useTutorSession();

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
      ? { backgroundColor: "#006400", color: "#ffffff", borderColor: "#006400" }
      : { backgroundColor: "#ffffff", color: "#111111", borderColor: "#d4d4d8" };
  }

  const signupHref = role === "tutor"
    ? (next ? `/tutor-signup?next=${encodeURIComponent(next)}` : "/tutor-signup")
    : (next ? `/parent-signup?next=${encodeURIComponent(next)}` : "/parent-signup");

  if (!viewerReady) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: "#111111" }}>Loading sign-in...</p>;
  }

  if (isTutor) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: "#111111" }}>Opening your profile...</p>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10" style={{ color: "#1a1a1a" }}>
      <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Log in</h1>
      <div className="mt-3 mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-6" style={{ color: "#111111" }}>
        {role === "tutor"
          ? "Tutors sign in with the email and password from Tutor Sign Up."
          : "Parents sign in with the email and password from Parent Sign Up."}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["parent", "tutor"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => {
              setRole(choice);
              setError(null);
            }}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={roleButtonStyle(role === choice)}
          >
            {choice === "parent" ? "I am a parent" : "I am a tutor"}
          </button>
        ))}
      </div>

      <form
        onSubmit={signInWithPassword}
        className="space-y-4 rounded-lg bg-white p-6 shadow"
        style={{ backgroundColor: "#ffffff", color: "#111111", borderTop: "4px solid #006400" }}
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
            className="w-full rounded border border-zinc-300 px-3 py-2"
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
            className="w-full rounded border border-zinc-300 px-3 py-2"
            style={fieldStyle}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 font-medium disabled:opacity-50"
          style={{ backgroundColor: "#006400", color: "#ffffff" }}
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
        {viewerReady && !isTutor && (
          <p className="text-sm" style={{ color: "#3f3f46" }}>
            {role === "tutor" ? "New tutor? " : "New parent? "}
            <Link href={signupHref} className="underline" style={{ color: "#006400" }}>
              {role === "tutor" ? "Tutor Sign Up" : "Parent Sign Up"}
            </Link>
          </p>
        )}
      </form>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="max-w-md mx-auto px-4 py-16" style={{ color: "#111111" }}>Loading sign-in...</p>}>
      <LoginForm />
    </Suspense>
  );
}
