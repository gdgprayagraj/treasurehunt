/**
 * Answer normalization + comparison for the treasure hunt.
 *
 * Answers can be anything — a number, a word, or a phrase. Participants type them
 * by hand outdoors, so we compare defensively: when both sides parse cleanly as
 * numbers we do a numeric-safe compare (ignoring thousands separators and leading
 * zeros); otherwise we fall back to a case-insensitive, whitespace-trimmed string
 * compare.
 */

/** Trim only — used when persisting `correctAnswer` on a QR code. */
export function normalizeStoredAnswer(raw: string): string {
  return String(raw ?? "").trim();
}

function stripLeadingZeros(s: string): string {
  // "007" -> "7", "000" -> "0", "0.50" left to numeric path
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const stripped = body.replace(/^0+(?=\d)/, "");
  return (neg ? "-" : "") + stripped;
}

/** Return a canonical numeric value if the input cleanly represents a number. */
function toComparableNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  // Accept optional sign, digits, optional single decimal point.
  if (!/^[-+]?\d*\.?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Loose, comparison-ready form of an answer string. */
export function canonicalizeAnswer(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  const asNumber = toComparableNumber(trimmed);
  if (asNumber !== null) return String(asNumber);
  return stripLeadingZeros(trimmed.toLowerCase());
}

/** True when a participant's submitted answer matches the stored correct answer. */
export function answersMatch(submitted: string, correct: string): boolean {
  const a = String(submitted ?? "").trim();
  const b = String(correct ?? "").trim();
  if (a === "" || b === "") return false;

  const na = toComparableNumber(a);
  const nb = toComparableNumber(b);
  if (na !== null && nb !== null) return na === nb;

  return canonicalizeAnswer(a) === canonicalizeAnswer(b);
}

/** Digits-only phone form used for cross-platform participant matching. */
export function normalizePhone(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/** Lower-cased, trimmed email used for case-insensitive participant matching. */
export function normalizeEmail(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

/** Upper-cased, whitespace-stripped roll/student ID for consistent matching. */
export function normalizeRollNumber(raw: string): string {
  return String(raw ?? "").replace(/\s+/g, "").toUpperCase();
}
