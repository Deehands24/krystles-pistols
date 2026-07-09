import { defineField, defineType } from "sanity";

// Reused verbatim from the original mockup's chip taxonomy — real product content,
// not placeholder copy. See reference/legacy-mockup/index.html:474-475.
export const VIBE_OPTIONS = [
  "Confident",
  "Romantic",
  "Adventurous",
  "Switch",
  "Dominant",
  "Submissive",
  "Playful",
  "Mysterious",
  "Sensual",
  "Wild Card",
];

export const TURN_ON_OPTIONS = [
  "Roleplay",
  "Power play",
  "Praise",
  "Spontaneity",
  "Slow burn",
  "Sensory play",
  "Teasing",
  "Aftercare",
  "Bondage curious",
  "Denial",
];

export default defineType({
  name: "posterProfile",
  title: "Poster Profile",
  type: "document",
  fields: [
    defineField({
      name: "accountId",
      title: "Account ID",
      type: "string",
      description: "Supabase auth.users.id — the shared key between Supabase and this doc.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "displayName" },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "displayName", title: "Display name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "age", title: "Age", type: "number", validation: (rule) => rule.required().min(21) }),
    defineField({ name: "city", title: "City", type: "string" }),
    defineField({ name: "bio", title: "Bio", type: "text" }),
    defineField({
      name: "bioSource",
      title: "Bio source",
      type: "string",
      options: { list: ["manual", "ai"] },
      initialValue: "manual",
    }),
    defineField({
      name: "vibeTags",
      title: "Vibe",
      type: "array",
      of: [{ type: "string" }],
      options: { list: VIBE_OPTIONS },
    }),
    defineField({
      name: "turnOnTags",
      title: "Turn-ons",
      type: "array",
      of: [{ type: "string" }],
      options: { list: TURN_ON_OPTIONS },
    }),
    defineField({ name: "favoriteColor", title: "Favorite color", type: "string" }),
    defineField({ name: "favoriteDrink", title: "Favorite drink", type: "string" }),
    defineField({ name: "idealNight", title: "Ideal night", type: "string" }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (rule) => rule.max(6),
    }),
    defineField({ name: "video", title: "Video", type: "file" }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      description: "App-controlled visibility flag — set by the payment webhook and lifecycle cron, never edited by hand.",
      initialValue: false,
    }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      options: { list: ["none", "boosted"] },
      initialValue: "none",
      description: "Hook for a future one-time boost upsell. Not wired to anything in MVP.",
    }),
  ],
  preview: {
    select: { title: "displayName", subtitle: "city", media: "photos.0" },
  },
});
