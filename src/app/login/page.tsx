"use client";

import { FormEvent, Suspense, useState } from "react";
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
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = safeNext(searchParams.get("next"));

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
    router.replace(destinationFor("parent", next));
  }

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setLoading(true);
    rememberChoice();

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("role", role);
    if (next) redirectTo.searchParams.set("next", next);

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo.toString(),
      },
    });

    setLoading(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setSent(true);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.replace(destinationFor(role, next));
  }

  function roleButtonStyle(selected: boolean) {
    return selected
      ? { backgroundColor: "#006400", color: "#ffffff", borderColor: "#006400" }
      : { backgroundColor: "#ffffff", color: "#111111", borderColor: "#d4d4d8" };
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10" style={{ color: "#1a1a1a" }}>
      <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Log in</h1>
      <div className="mt-3 mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-6" style={{ color: "#111111" }}>
        {role === "tutor"
          ? "Tutors sign in with an email code, then finish the tutor profile."
          : "Parents sign in with the email and password from Parent Sign Up."}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["parent", "tutor"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => {
              setRole(choice);
              setSent(false);
              setError(null);
            }}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={roleButtonStyle(role === choice)}
          >
            {choice === "parent" ? "I am a parent" : "I am a tutor"}
          </button>
        ))}
      </div>

      {role === "parent" ? (
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
          <p className="text-sm" style={{ color: "#3f3f46" }}>
            New parent?{" "}
            <Link
              href={next ? `/parent-signup?next=${encodeURIComponent(next)}` : "/parent-signup"}
              className="underline"
              style={{ color: "#006400" }}
            >
              Parent Sign Up
            </Link>
          </p>
        </form>
      ) : !sent ? (
        <form
          onSubmit={sendCode}
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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 font-medium disabled:opacity-50"
            style={{ backgroundColor: "#006400", color: "#ffffff" }}
          >
            {loading ? "Sending..." : "Email me a code"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={verifyCode}
          className="space-y-4 rounded-lg bg-white p-6 shadow"
          style={{ backgroundColor: "#ffffff", color: "#111111", borderTop: "4px solid #ffd200" }}
        >
          <p className="text-sm" style={{ color: "#3f3f46" }}>
            We sent a 6-digit code to <span style={{ color: "#111111", fontWeight: 600 }}>{email}</span>.
            Enter it below, or open the link in that email.
          </p>
          <div>
            <label htmlFor="code" style={labelStyle}>Code</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded border border-zinc-300 px-3 py-3 text-center text-2xl tracking-[0.4em]"
              style={fieldStyle}
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg py-3 font-medium disabled:opacity-50"
            style={{ backgroundColor: "#006400", color: "#ffffff" }}
          >
            {loading ? "Checking..." : "Verify and continue"}
          </button>
          <div className="flex justify-between text-sm">
            <button type="button" style={{ color: "#006400" }} onClick={() => sendCode()} disabled={loading}>
              Resend code
            </button>
            <button
              type="button"
              style={{ color: "#3f3f46" }}
              onClick={() => {
                setSent(false);
                setCode("");
                setError(null);
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {role === "tutor" && (
        <p className="mt-4 text-xs" style={{ color: "#3f3f46" }}>
          After the code is accepted you can create your tutor profile.
        </p>
      )}
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
