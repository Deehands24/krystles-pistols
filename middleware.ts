import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Messages/admin route gates (their own matchers, per the plan) land in Phases 6/7.
// This is UX convenience only — the real enforcement is server-side in each route/action.
const POSTER_ONLY_PREFIXES = ["/dashboard", "/verify-identity"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsPoster = POSTER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (needsPoster) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/log-in";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: account } = await supabase
      .from("accounts")
      .select("role, status")
      .eq("id", user.id)
      .single();

    const blocked =
      !account ||
      account.role !== "poster" ||
      account.status === "banned" ||
      account.status === "deleted";

    if (blocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
