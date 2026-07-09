import Link from "next/link";

export default function VerificationReturnPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20 text-center">
      <p className="mb-2 text-xs font-medium tracking-[0.2em] text-gold-500 uppercase">
        Identity Verification
      </p>
      <h1 className="mb-4 font-serif text-3xl text-gold-100">Thanks — almost there.</h1>
      <p className="mb-8 text-sm text-zinc-400">
        We&apos;re confirming the result with our verification partner now. This can take a
        minute or two.
      </p>
      <Link
        href="/verify-identity"
        className="rounded-full bg-gold-500 px-6 py-3.5 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90"
      >
        Check Status →
      </Link>
    </main>
  );
}
