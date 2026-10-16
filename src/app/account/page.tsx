"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { type AuthRole, parseRole } from "@/lib/auth-redirect";

export default function AccountPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AuthRole>("parent");
  const [resending, setResending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      const user = data.user;
      if (!user) {
        router.replace("/login?next=/account");
        return;
      }
      const metadataRole = user.user_metadata?.role;
      let accountRole = parseRole(typeof metadataRole === "string" ? metadataRole : null);
      if (accountRole !== "tutor") {
        const { data: tutor } = await supabase.from("tutors").select("id").eq("user_id", user.id).maybeSingle();
        if (tutor) accountRole = "tutor";
      }
      if (cancelled) return;
      setEmail(user.email ?? "");
      setRole(accountRole);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function resendConfirmation() {
    setError(null);
    setMessage(null);
    if (!email) {
      setError("This login has no email address.");
      return;
    }
    setResending(true);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("role", role);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo.toString() },
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage(`Confirmation email sent to ${email}.`);
  }

  async function deleteAccount() {
    setError(null);
    setMessage(null);
    setDeleting(true);
    const { error: deleteError } = await supabase.rpc("delete_own_account");
    if (deleteError) {
      setDeleting(false);
      const needsSetup = /delete_own_account|schema cache|could not find the function|PGRST202/i.test(deleteError.message);
      setError(needsSetup
        ? "Account deletion is not set up yet. In the Supabase SQL editor, run the delete account section of supabase/schema.sql, then try again."
        : deleteError.message);
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/");
  }

  if (!ready) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: "#111111" }}>Checking your account...</p>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10" style={{ color: "#1a1a1a" }}>
      <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Account</h1>
      <div className="mt-3 mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-6" style={{ color: "#111111" }}>
        Signed in as {email}. These actions are available for parent and tutor logins.
      </p>

      <section
        className="space-y-4 rounded-lg bg-white p-6 shadow"
        style={{ backgroundColor: "#ffffff", color: "#111111", borderTop: "4px solid #006400" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "#111111" }}>Confirmation email</h2>
        <p className="text-sm" style={{ color: "#3f3f46" }}>
          Send another confirmation message to {email}. The link confirms this {role} account.
        </p>
        <button
          type="button"
          onClick={resendConfirmation}
          disabled={resending || deleting}
          className="w-full rounded-lg py-3 font-medium disabled:opacity-50"
          style={{ backgroundColor: "#006400", color: "#ffffff" }}
        >
          {resending ? "Sending..." : "Resend confirmation email"}
        </button>
      </section>

      <section
        className="mt-6 space-y-4 rounded-lg bg-white p-6 shadow"
        style={{ backgroundColor: "#ffffff", color: "#111111", borderTop: "4px solid #d40000" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "#111111" }}>Delete account</h2>
        <p className="text-sm" style={{ color: "#3f3f46" }}>
          This permanently deletes the login for {email}. Parent details, a tutor profile, uploaded photo or video, and bookings tied to this account are removed.
        </p>
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMessage(null);
              setConfirmingDelete(true);
            }}
            disabled={deleting || resending}
            className="w-full rounded-lg py-3 font-medium disabled:opacity-50"
            style={{ backgroundColor: "#ffffff", color: "#d40000", border: "1px solid #d40000" }}
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: "#111111" }}>
              Delete {email} now? This cannot be undone.
            </p>
            <button
              type="button"
              onClick={deleteAccount}
              disabled={deleting}
              className="w-full rounded-lg py-3 font-medium disabled:opacity-50"
              style={{ backgroundColor: "#d40000", color: "#ffffff" }}
            >
              {deleting ? "Deleting..." : "Delete this account"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="w-full rounded-lg py-3 font-medium disabled:opacity-50"
              style={{ backgroundColor: "#ffffff", color: "#111111", border: "1px solid #d4d4d8" }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-4 text-sm" style={{ color: "#111111" }}>{message}</p>}
    </div>
  );
}
