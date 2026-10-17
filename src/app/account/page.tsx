"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const user = data.user;
      if (!user) {
        router.replace("/login?next=/account");
        return;
      }
      setEmail(user.email ?? "");
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: "#111111" }}>Checking your account...</p>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10" style={{ color: "#1a1a1a" }}>
      <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Account</h1>
      <div className="mt-3 mb-4 h-1.5 w-16 bg-zw-gold" />
      <p style={{ color: "#111111" }}>Signed in as {email}.</p>
    </div>
  );
}
