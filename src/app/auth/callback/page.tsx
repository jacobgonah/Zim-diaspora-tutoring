"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  AUTH_NEXT_KEY,
  AUTH_ROLE_KEY,
  destinationFor,
  parseRole,
} from "@/lib/auth-redirect";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const role = parseRole(url.searchParams.get("role") || sessionStorage.getItem(AUTH_ROLE_KEY));
      const next = url.searchParams.get("next") || sessionStorage.getItem(AUTH_NEXT_KEY);

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
      } else if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (verifyError) {
          if (!cancelled) setError(verifyError.message);
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!cancelled) setError("This email link is invalid or has expired.");
          return;
        }
      }

      if (!cancelled) router.replace(destinationFor(role, next));
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-bold text-white">Email link failed</h1>
          <p className="mt-3 text-sm text-red-300">{error}</p>
          <Link href="/login" className="mt-6 inline-block hover:underline" style={{ color: '#FFD200' }}>
            Back to log in
          </Link>
        </>
      ) : (
        <p className="text-neutral-300">Confirming your email...</p>
      )}
    </div>
  );
}
