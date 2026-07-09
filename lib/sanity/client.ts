import { createClient } from "@sanity/client";

/** Public, CDN-cached reads — safe for Server Components rendering public browse/profile pages. */
export const sanityReadClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-01-01",
  useCdn: true,
});

/**
 * Authenticated writes — server-only (dashboard Server Actions, lifecycle cron, webhooks).
 * Requires SANITY_API_WRITE_TOKEN (Editor permission). Never import from client components.
 */
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
