import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/lib/auth/actions";

export default async function VerifyIdentityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/log-in");

  const { data: account } = await supabase
    .from("accounts")
    .select("role, identity_verified_at")
    .eq("id", user.id)
    .single();
  if (!account || account.role !== "poster") redirect("/");

  const { data: latest } = await supabase
    .from("identity_verifications")
    .select("status, status_updated_at")
    .eq("account_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20 text-center">
      <p className="mb-2 text-xs font-medium tracking-[0.2em] text-gold-500 uppercase">
        Identity Verification
      </p>

      {error === "verification_unavailable" && (
        <p className="mb-6 rounded-xl border border-rose-900 bg-rose-950/20 px-4 py-3 text-sm text-rose-400">
          Verification is temporarily unavailable. Please try again shortly.
        </p>
      )}

      {account.identity_verified_at ? (
        <>
          <h1 className="mb-4 font-serif text-3xl text-gold-100">You&apos;re verified ✓</h1>
          <p className="text-sm text-zinc-400">
            Your identity has been confirmed. The posting dashboard is coming soon — check
            back shortly.
          </p>
        </>
      ) : latest?.status === "pending" ? (
        <>
          <h1 className="mb-4 font-serif text-3xl text-gold-100">Verification submitted</h1>
          <p className="text-sm text-zinc-400">
            We&apos;re reviewing your ID now — this usually takes just a few minutes. This
            page will update automatically once it&apos;s confirmed.
          </p>
        </>
      ) : latest?.status === "declined" ? (
        <>
          <h1 className="mb-4 font-serif text-3xl text-gold-100">Verification declined</h1>
          <p className="mb-6 text-sm text-zinc-400">
            We couldn&apos;t confirm your identity from that attempt. You can try again below.
          </p>
          <form action="/api/verification/start" method="POST">
            <button
              type="submit"
              className="w-full rounded-full bg-gold-500 px-6 py-3.5 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90"
            >
              Try Again →
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="mb-4 font-serif text-3xl text-gold-100">Let&apos;s verify you&apos;re real.</h1>
          <p className="mb-6 text-sm text-zinc-400">
            Posters go through a quick, private ID check before their listing goes live.
            You&apos;ll be redirected to our verification partner, Persona, and back here when
            you&apos;re done.
          </p>
          <form action="/api/verification/start" method="POST">
            <button
              type="submit"
              className="w-full rounded-full bg-gold-500 px-6 py-3.5 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90"
            >
              Start Verification →
            </button>
          </form>
        </>
      )}

      <form action={logOut} className="mt-10">
        <button type="submit" className="text-xs text-zinc-500 hover:text-zinc-300">
          Log out
        </button>
      </form>
    </main>
  );
}
