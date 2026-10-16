"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthMenu() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!email) {
    return (
      <Link
        href="/login"
        className="header-login inline-flex items-center rounded-lg border px-4 py-2 font-bold"
      >
        Log in
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-3">
      <Link href="/bookings" className="font-bold" style={{ color: "#006400" }}>
        My bookings
      </Link>
      <span className="max-w-36 truncate text-zinc-500">{email}</span>
      <button
        type="button"
        className="hover:text-zw-green"
        onClick={() => supabase.auth.signOut()}
      >
        Log out
      </button>
    </span>
  );
}
