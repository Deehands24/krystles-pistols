import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createPersonaInquiry } from "@/lib/verification/persona";

// POSTed to directly from a <form> on /verify-identity — 303 so the browser's
// follow-up navigation to Persona's hosted URL is a GET, not a re-POST.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/log-in", request.url), 303);
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("role, identity_verified_at")
    .eq("id", user.id)
    .single();

  if (!account || account.role !== "poster") {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }
  if (account.identity_verified_at) {
    return NextResponse.redirect(new URL("/verify-identity", request.url), 303);
  }

  let inquiryId: string;
  let oneTimeLink: string;
  try {
    ({ inquiryId, oneTimeLink } = await createPersonaInquiry(user.id));
  } catch (err) {
    console.error("Persona inquiry creation failed", err);
    return NextResponse.redirect(
      new URL("/verify-identity?error=verification_unavailable", request.url),
      303,
    );
  }

  const serviceClient = createServiceRoleClient();
  await serviceClient.from("identity_verifications").insert({
    account_id: user.id,
    persona_inquiry_id: inquiryId,
    status: "pending",
  });

  return NextResponse.redirect(oneTimeLink, 303);
}
