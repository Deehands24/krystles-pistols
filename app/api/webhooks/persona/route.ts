import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyPersonaSignature } from "@/lib/verification/persona";
import { handlePersonaEvent } from "@/lib/verification/handlePersonaEvent";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("persona-signature");

  if (!verifyPersonaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const externalEventId: string | undefined = payload.data?.id;
  if (!externalEventId) {
    return NextResponse.json({ error: "missing event id" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  // webhook_events has a unique (provider, external_event_id) index — a duplicate
  // delivery hits the constraint and we short-circuit before touching anything else.
  const { error: insertError } = await serviceClient.from("webhook_events").insert({
    source: "persona",
    provider: "persona",
    external_event_id: externalEventId,
    payload,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("persona webhook_events insert failed", insertError);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  await handlePersonaEvent(serviceClient, payload);

  await serviceClient
    .from("webhook_events")
    .update({ processed: true })
    .eq("provider", "persona")
    .eq("external_event_id", externalEventId);

  return NextResponse.json({ received: true });
}
