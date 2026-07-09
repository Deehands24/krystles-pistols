import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";

export default defineConfig({
  name: "default",
  title: "Krystle's Pistols",
  projectId: "c575t6ib",
  dataset: "production",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
