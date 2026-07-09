"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { logIn, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

function LogInForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";
  const [state, formAction, pending] = useActionState(logIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />
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
        placeholder="Password"
        className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-gold-500 focus:outline-none"
      />

      {state.error && <p className="text-sm text-rose-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-gold-500 px-6 py-3.5 text-center text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Logging in…" : "Log In →"}
      </button>
    </form>
  );
}

export default function LogInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20">
      <h1 className="mb-8 text-center font-serif text-3xl text-gold-100">Welcome back.</h1>

      <Suspense fallback={null}>
        <LogInForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-zinc-500">
        No account yet?{" "}
        <Link href="/sign-up" className="text-gold-400 hover:text-gold-300">
          Sign up
        </Link>
      </p>
    </main>
  );
}
