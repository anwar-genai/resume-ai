// Only expose internal error messages to clients outside production, so prod
// responses don't leak stack/driver details. Spread into a JSON body:
//   NextResponse.json({ error: "Generation failed", ...devDetail(e) }, ...)
export function devDetail(e: unknown): { detail?: string } {
  if (process.env.NODE_ENV === "production") return {};
  const message = e instanceof Error ? e.message : String(e);
  return { detail: message };
}
