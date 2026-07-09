"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpPoster, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

export default function PosterSignUpPage() {
  const [state, formAction, pending] = useActionState(signUpPoster, initialState);

  if (state.needsEmailConfirmation) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-gold-100">Check your email</h1>
        <p className="mt-4 text-sm text-zinc-400">
          We sent a confirmation link to finish creating your account. Once confirmed,{" "}
          <Link href="/log-in" className="text-gold-400 hover:text-gold-300">
            log in
          </Link>{" "}
          to continue to identity verification.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20">
      <p className="mb-2 text-center text-xs font-medium tracking-[0.2em] text-gold-500 uppercase">
        Create account
      </p>
      <h1 className="mb-8 text-center font-serif text-3xl text-gold-100">
        Let&apos;s get you posted.
      </h1>

      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-gold-500 focus:outline-none"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password"
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-gold-500 focus:outline-none"
        />
        <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 focus:border-gold-500 focus:outline-none"
          />
        </label>

        {state.error && <p className="text-sm text-rose-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-gold-500 px-6 py-3.5 text-center text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Continue to Verification →"}
        </button>
      </form>

      <Link
        href="/sign-up"
        className="mt-6 text-center text-xs text-zinc-500 hover:text-zinc-300"
      >
        ← back
      </Link>
    </main>
  );
}
