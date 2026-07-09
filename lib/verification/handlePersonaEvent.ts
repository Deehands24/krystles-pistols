import type { SupabaseClient } from "@supabase/supabase-js";

type VerificationStatus = "pending" | "approved" | "declined" | "expired";

const APPROVED_STATUSES = new Set(["completed", "approved"]);
const DECLINED_STATUSES = new Set(["declined", "failed"]);
const EXPIRED_STATUSES = new Set(["expired"]);

function toVerificationStatus(inquiryStatus: string): VerificationStatus {
  if (APPROVED_STATUSES.has(inquiryStatus)) return "approved";
  if (DECLINED_STATUSES.has(inquiryStatus)) return "declined";
  if (EXPIRED_STATUSES.has(inquiryStatus)) return "expired";
  return "pending";
}

/**
 * Persona webhook payload shape is inferred from public docs (event wraps an
 * embedded `inquiry` resource) — unverified against a live payload since no
 * PERSONA_* keys are configured yet. Re-check field names against a real
 * `inquiry.*` event once verification goes live.
 */
export async function handlePersonaEvent(
  serviceClient: SupabaseClient,
  payload: {
    data?: { attributes?: { payload?: { data?: { id?: string; type?: string; attributes?: Record<string, unknown> } } } };
  },
): Promise<void> {
  const inquiry = payload.data?.attributes?.payload?.data;
  if (!inquiry || inquiry.type !== "inquiry" || !inquiry.id) return;

  const inquiryId = inquiry.id;
  const inquiryStatus = String(inquiry.attributes?.status ?? "");
  const referenceId = inquiry.attributes?.["reference-id"] as string | undefined;
  const status = toVerificationStatus(inquiryStatus);

  const { data: existing } = await serviceClient
    .from("identity_verifications")
    .select("account_id")
    .eq("persona_inquiry_id", inquiryId)
    .maybeSingle();

  const accountId = existing?.account_id ?? referenceId;
  if (!accountId) return;

  const now = new Date().toISOString();

  await serviceClient.from("identity_verifications").upsert(
    {
      account_id: accountId,
      persona_inquiry_id: inquiryId,
      status,
      status_updated_at: now,
      approved_at: status === "approved" ? now : null,
      raw_webhook_payload: payload,
    },
    { onConflict: "persona_inquiry_id" },
  );

  if (status === "approved") {
    await serviceClient.from("accounts").update({ identity_verified_at: now }).eq("id", accountId);
  }
}
