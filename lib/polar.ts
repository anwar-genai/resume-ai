import { Polar } from "@polar-sh/sdk";

// POLAR_SERVER controls which Polar environment we hit.
// Use "sandbox" for local development/testing, "production" once you go live.
const server = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server,
});

export const POLAR_PRODUCT_ID = process.env.POLAR_PRODUCT_ID ?? "";
