import { createHmac, timingSafeEqual } from "node:crypto";

const PERSONA_API_BASE = "https://api.withpersona.com/api/v1";
const PERSONA_API_VERSION = "2023-01-05";

export class PersonaConfigError extends Error {}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new PersonaConfigError(`${name} is not set`);
  return value;
}

/**
 * Creates a hosted Persona Inquiry for the given account and returns a one-time
 * link the poster is redirected to. `reference-id` carries our account id so the
 * webhook can resolve the inquiry back to an account without a client-supplied id.
 */
export async function createPersonaInquiry(
  accountId: string,
): Promise<{ inquiryId: string; oneTimeLink: string }> {
  const apiKey = requireEnv("PERSONA_API_KEY");
  const templateId = requireEnv("PERSONA_TEMPLATE_ID");

  const createRes = await fetch(`${PERSONA_API_BASE}/inquiries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Persona-Version": PERSONA_API_VERSION,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          "inquiry-template-id": templateId,
          "reference-id": accountId,
        },
      },
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Persona inquiry creation failed (${createRes.status}): ${await createRes.text()}`);
  }
  const created = await createRes.json();
  const inquiryId: string = created.data.id;

  const linkRes = await fetch(`${PERSONA_API_BASE}/inquiries/${inquiryId}/generate-one-time-link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Persona-Version": PERSONA_API_VERSION,
    },
  });
  if (!linkRes.ok) {
    throw new Error(`Persona one-time link generation failed (${linkRes.status}): ${await linkRes.text()}`);
  }
  const linkData = await linkRes.json();
  const oneTimeLink: string = linkData.meta["one-time-link"];

  return { inquiryId, oneTimeLink };
}

/**
 * Persona signs webhooks as `Persona-Signature: t=<timestamp>,v1=<hex hmac>` over
 * `${t}.${rawBody}`. Verify against the raw request body (not re-serialized JSON).
 */
export function verifyPersonaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.PERSONA_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((pair) => pair.split("=") as [string, string]),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return timingSafeEqual(expectedBuf, actualBuf);
}
