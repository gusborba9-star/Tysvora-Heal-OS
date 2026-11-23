import { EntityId, requireId } from "../shared/ids.js";
import { DomainInvariantError } from "../core/domain/errors.js";
import { Channel, CHANNELS } from "./consent.js";

export const MAX_DEMAND_TEXT = 4096;

/** A message a person sent us on their own initiative. Never discarded: an unlinked one waits for a human. */
export interface PatientDemand {
  readonly id: EntityId; readonly tenantId: EntityId; readonly organizationId: EntityId;
  /** Absent until the sender is matched to exactly one person (automatically or by staff). */
  readonly subjectId?: EntityId;
  readonly channel: Channel; readonly externalId: string; readonly fromAddress: string;
  readonly kind: "text" | "unsupported"; readonly text: string;
  readonly receivedAt: string; readonly status: "new" | "answered";
  readonly linkedBy?: "auto" | EntityId; readonly answeredAt?: string; readonly answeredBy?: EntityId;
}

/** Removes control characters (keeps line breaks and tabs) and bounds length; the text is data, never markup. */
export function sanitizeDemandText(raw: string): string {
  return String(raw ?? "").normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g, "").slice(0, MAX_DEMAND_TEXT);
}

export function createDemand(input: Omit<PatientDemand, "status" | "text"> & { text: string }): PatientDemand {
  if (!CHANNELS.includes(input.channel)) throw new DomainInvariantError("unknown channel");
  if (Number.isNaN(Date.parse(input.receivedAt))) throw new DomainInvariantError("demand.receivedAt must be a valid timestamp");
  if (typeof input.externalId !== "string" || input.externalId.length < 1 || input.externalId.length > 256) throw new DomainInvariantError("demand.externalId is required");
  return {
    id: requireId(input.id, "demand.id"), tenantId: requireId(input.tenantId, "demand.tenantId"), organizationId: requireId(input.organizationId, "demand.organizationId"),
    subjectId: input.subjectId, channel: input.channel, externalId: input.externalId, fromAddress: input.fromAddress, kind: input.kind,
    text: input.kind === "text" ? sanitizeDemandText(input.text) : "", receivedAt: input.receivedAt, status: "new", linkedBy: input.linkedBy
  };
}
