/**
 * Cloudflare R2 storage for generated QR PNGs — via the Hridx r2-upload Worker.
 * Server-side only (the Worker password must never reach the browser).
 *
 * Flow:
 *   1. POST {password}  -> { token }              (short-lived HMAC token)
 *   2. PUT  /api/upload/<key> (Bearer)            (uploads the object)
 *   3. Public URL is reconstructed as `${R2_PUBLIC_BASE}/<key>` — the Worker
 *      doesn't return a URL, so we build it from the key.
 */

export interface R2UploadResult {
  url: string;
  key: string;
}

const KEY_PREFIX = process.env.R2_KEY_PREFIX || "treasure-hunt/";
const ENDPOINT = (process.env.R2_UPLOAD_ENDPOINT || "").replace(/\/+$/, "");
const PASSWORD = process.env.R2_UPLOAD_PASSWORD || "";
const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "").replace(/\/+$/, "");

export function isR2Configured(): boolean {
  return Boolean(ENDPOINT && PASSWORD && PUBLIC_BASE);
}

/** Build the public URL for an object key. */
export function publicUrlForKey(key: string): string {
  return `${PUBLIC_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function getToken(): Promise<string> {
  const res = await fetch(`${ENDPOINT}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  });
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error || `R2 auth failed (${res.status})`);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("R2 auth returned no token");
  return data.token;
}

/** Upload a PNG buffer to R2 and return its public URL + object key. */
export async function uploadQrImage(
  png: Buffer,
  slug: string,
): Promise<R2UploadResult> {
  if (!isR2Configured()) {
    throw new Error(
      "R2 is not configured. Set R2_UPLOAD_ENDPOINT, R2_UPLOAD_PASSWORD and R2_PUBLIC_BASE.",
    );
  }

  const key = `${KEY_PREFIX}qr/${slug}.png`;
  const token = await getToken();
  const res = await fetch(`${ENDPOINT}/api/upload/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/png",
    },
    // Wrap in a fresh Uint8Array so the body is a valid BodyInit for fetch's types.
    body: new Uint8Array(png),
  });
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error || `R2 upload failed (${res.status})`);
  }

  return { url: publicUrlForKey(key), key };
}
