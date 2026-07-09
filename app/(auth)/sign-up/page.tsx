import Link from "next/link";

export default function SignUpRolePickerPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
      <div className="mb-12 text-center">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold-500 uppercase">
          21+ · Members Only
        </p>
        <h1 className="font-serif text-4xl text-gold-100">Which one are you?</h1>
        <p className="mt-3 text-sm text-zinc-400">You can always add the other later.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/sign-up/poster"
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-9 text-center transition-colors hover:border-gold-500"
        >
          <div className="mb-4 text-4xl">✍️</div>
          <div className="mb-2 font-serif text-xl text-gold-100">I want to be found</div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Post your photos, video &amp; AI-written bio. $150 for 72 hours.
          </p>
        </Link>

        <Link
          href="/sign-up/browser"
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-9 text-center transition-colors hover:border-gold-500"
        >
          <div className="mb-4 text-4xl">👀</div>
          <div className="mb-2 font-serif text-xl text-gold-100">I want to browse</div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Unlimited access to every profile. Totally free.
          </p>
        </Link>
      </div>

      <p className="mt-10 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/log-in" className="text-gold-400 hover:text-gold-300">
          Log in
        </Link>
      </p>
    </main>
  );
}
