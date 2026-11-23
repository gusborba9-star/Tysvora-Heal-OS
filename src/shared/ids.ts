export type EntityId = string;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const MAX_TEXT_LENGTH = 256;
const MAX_NAME_LENGTH = 200;
// Control characters (Cc) and invisible/format characters (Cf: zero-width, bidi overrides,
// soft hyphen) plus line/paragraph separators are never legitimate in names or identifiers.
const INVISIBLE_OR_CONTROL = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:@-]{0,127}$/;

function normalizeText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`);
  const normalized = value.normalize("NFC").trim();
  if (!normalized) throw new ValidationError(`${field} must not be empty`);
  if (normalized.length > maxLength) throw new ValidationError(`${field} must not exceed ${maxLength} characters`);
  if (INVISIBLE_OR_CONTROL.test(normalized)) throw new ValidationError(`${field} contains control or invisible characters`);
  return normalized;
}

/** General short text (codes, actions, resources, keys). Returns the normalized value. */
export function requireNonEmpty(value: string, field: string): string {
  const normalized = normalizeText(value, field, MAX_TEXT_LENGTH);
  if (/[<>]/.test(normalized)) throw new ValidationError(`${field} must not contain angle brackets`);
  return normalized;
}

/** Human-readable names. Markup characters are rejected here; escape again at every output edge. */
export function requireName(value: string, field: string): string {
  const normalized = normalizeText(value, field, MAX_NAME_LENGTH);
  if (/[<>]/.test(normalized)) throw new ValidationError(`${field} must not contain angle brackets`);
  return normalized;
}

/** Identifiers: ASCII, no whitespace, at most 128 characters. */
export function requireId(value: string, field: string): string {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw new ValidationError(`${field} must be 1-128 characters of letters, digits, '.', '_', ':', '@' or '-' and start with a letter or digit`);
  }
  return value;
}

/** Reserved pseudo-tenant used only to attribute platform-level audit entries and events. */
export const PLATFORM_SCOPE_ID = "platform.scope";
