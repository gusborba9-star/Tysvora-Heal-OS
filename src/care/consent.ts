import { EntityId, requireId, requireNonEmpty } from "../shared/ids.js";
import { DomainInvariantError } from "../core/domain/errors.js";

export type Channel = "whatsapp" | "sms" | "email" | "app";
export const CHANNELS: readonly Channel[] = ["whatsapp", "sms", "email", "app"];
export type ContactPurpose = "care-contact" | "reminders" | "program-communications";
export const PURPOSES: readonly ContactPurpose[] = ["care-contact", "reminders", "program-communications"];
/** Registered as given; which basis applies to a use is a legal decision for the institution and counsel, not for the code. */
export type LegalBasis = "consent" | "health-protection";

/** Permission for the institution to contact a person through a channel for a purpose (LGPD purpose limitation). Immutable history: revoking keeps the row. */
export interface ConsentRecord {
  readonly id: EntityId; readonly tenantId: EntityId; readonly subjectId: EntityId;
  readonly channel: Channel; readonly purpose: ContactPurpose; readonly legalBasis: LegalBasis;
  readonly status: "granted" | "revoked";
  readonly grantedAt: string; readonly grantedBy?: EntityId;
  /** Where the permission came from (e.g. "paper-form", "in-app", "verbal-recorded"); required so it can be demonstrated later. */
  readonly evidence: string;
  readonly revokedAt?: string; readonly revokedBy?: EntityId;
}

export function createConsent(input: Omit<ConsentRecord, "status" | "revokedAt" | "revokedBy">): ConsentRecord {
  if (!CHANNELS.includes(input.channel)) throw new DomainInvariantError("unknown channel: " + String(input.channel));
  if (!PURPOSES.includes(input.purpose)) throw new DomainInvariantError("unknown purpose: " + String(input.purpose));
  if (input.legalBasis !== "consent" && input.legalBasis !== "health-protection") throw new DomainInvariantError("unknown legal basis");
  if (Number.isNaN(Date.parse(input.grantedAt))) throw new DomainInvariantError("consent.grantedAt must be a valid timestamp");
  return {
    id: requireId(input.id, "consent.id"), tenantId: requireId(input.tenantId, "consent.tenantId"), subjectId: requireId(input.subjectId, "consent.subjectId"),
    channel: input.channel, purpose: input.purpose, legalBasis: input.legalBasis, status: "granted", grantedAt: input.grantedAt,
    grantedBy: input.grantedBy, evidence: requireNonEmpty(input.evidence, "consent.evidence")
  };
}
export function revokeConsent(c: ConsentRecord, at: string, by?: EntityId): ConsentRecord {
  if (c.status !== "granted") throw new DomainInvariantError("consent is already revoked");
  return { ...c, status: "revoked", revokedAt: at, revokedBy: by };
}

/** Normalizes a phone number to +E.164 digits; rejects anything that cannot be one. */
export function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/[\s().-]/g, "").replace(/^\+/, "");
  if (!/^[1-9][0-9]{7,14}$/.test(digits)) throw new DomainInvariantError("invalid phone number");
  return "+" + digits;
}
/**
 * Comparison key for an address. Brazilian mobile numbers circulate both with and without the ninth digit
 * (+55 DD 9XXXXXXXX / +55 DD XXXXXXXX); both map to the same key so a sender is never lost to that quirk.
 */
export function contactKey(channel: Channel, address: string): string {
  if (channel === "email") return address.trim().toLowerCase();
  const phone = normalizePhone(address);
  const m = /^\+55(\d{2})([6-9]\d{7})$/.exec(phone);
  return m ? `+55${m[1]}9${m[2]}` : phone;
}

/** A verified link between a person and an address; unverified bindings never route inbound messages to a record. */
export interface ContactBinding {
  readonly id: EntityId; readonly tenantId: EntityId; readonly subjectId: EntityId;
  readonly channel: Channel; readonly address: string; readonly addressKey: string;
  readonly status: "active" | "removed";
  readonly verification: "none" | "staff" | "code";
  readonly createdAt: string; readonly createdBy?: EntityId;
}
export function createContactBinding(input: { id: string; tenantId: string; subjectId: string; channel: Channel; address: string; verification: ContactBinding["verification"]; createdAt: string; createdBy?: string }): ContactBinding {
  if (!CHANNELS.includes(input.channel)) throw new DomainInvariantError("unknown channel");
  if (!["none", "staff", "code"].includes(input.verification)) throw new DomainInvariantError("unknown verification");
  const address = input.channel === "email" ? requireNonEmpty(input.address, "binding.address") : normalizePhone(input.address);
  return {
    id: requireId(input.id, "binding.id"), tenantId: requireId(input.tenantId, "binding.tenantId"), subjectId: requireId(input.subjectId, "binding.subjectId"),
    channel: input.channel, address, addressKey: contactKey(input.channel, address), status: "active", verification: input.verification,
    createdAt: input.createdAt, createdBy: input.createdBy
  };
}
