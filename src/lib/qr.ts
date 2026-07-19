import QRCode from "qrcode";
import { customAlphabet } from "nanoid";
import { uploadQrImage, type R2UploadResult } from "@/lib/r2";

// Unambiguous alphabet (no 0/O, 1/l/I) so a printed QR ID is easy to read/type.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const nano = customAlphabet(ALPHABET, 10);

/** A short, non-sequential, hard-to-guess public QR slug. */
export function generateQrSlug(): string {
  return nano();
}

/** Resolve the app's public base URL for building QR-encoded links. */
export function getBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (explicit || "http://localhost:3000").replace(/\/+$/, "");
}

/** Build the public riddle URL a QR image should encode. */
export function buildRiddleUrl(collegeSlug: string, qrSlug: string): string {
  return `${getBaseUrl()}/h/${collegeSlug}/riddle/${qrSlug}`;
}

/**
 * Generate a PNG QR image encoding the riddle URL and upload it to R2.
 * Returns the public URL + object key.
 */
export async function generateAndUploadQr(
  collegeSlug: string,
  qrSlug: string,
): Promise<R2UploadResult> {
  const url = buildRiddleUrl(collegeSlug, qrSlug);
  const png = await QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 640,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  return uploadQrImage(png, qrSlug);
}
