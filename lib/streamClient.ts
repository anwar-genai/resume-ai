// Client helper: POST JSON to a route that streams text/plain back, invoking
// `onChunk` with the accumulated text as tokens arrive. Throws on a non-OK
// response (reading the JSON error body), so pre-stream errors (401/403/429/400)
// surface normally. Returns the full text when the stream ends.
export async function streamPost(
  url: string,
  body: unknown,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    const err = ct.includes("application/json") ? (await res.json())?.error : await res.text();
    throw new Error(err || "Request failed");
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    onChunk(text);
    return text;
  }

  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk(full);
  }
  full += decoder.decode();
  onChunk(full);
  return full;
}
