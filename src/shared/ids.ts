export type EntityId = string;

export function requireNonEmpty(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} must not be empty`);
  return value;
}
