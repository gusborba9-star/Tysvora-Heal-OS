import { createHmac, timingSafeEqual } from "node:crypto";
import { Channel } from "./consent.js";

/** What every provider adapter reduces an incoming message to. */
export interface InboundMessage {
  readonly channel: Channel;
  /** The institution's own account/number the message was sent to (identifies the tenant). */
  readonly accountId: string;
  /** Provider message id; the idempotency key. */
  readonly externalId: string;
  readonly from: string;
  readonly receivedAt: string;
  readonly kind: "text" | "unsupported";
  readonly text: string;
}

/** Provider adapter: authenticity check and parsing only; no business rules. */
export interface ChannelProvider {
  readonly channel: Channel;
  verify(rawBody: string, headers: Readonly<Record<string, string | undefined>>): boolean;
  parse(rawBody: string): readonly InboundMessage[];
}

/** One institution's connection to a channel. `secretRef` points at the secret store; secrets never live in this table. */
export interface ChannelConnection {
  readonly id: string; readonly tenantId: string; readonly organizationId: string;
  readonly channel: Channel; readonly accountId: string;
  /** The technical-operator user the platform acts as when this account receives a message. */
  readonly serviceUserId: string;
  readonly secretRef?: string; readonly status: "active" | "disabled";
}
export interface ChannelConnectionRepository {
  findByAccount(channel: Channel, accountId: string): Promise<ChannelConnection | null>;
  save(connection: ChannelConnection): Promise<void>;
}
export class InMemoryChannelConnections implements ChannelConnectionRepository {
  private items = new Map<string, ChannelConnection>();
  async findByAccount(channel: Channel, accountId: string) { return this.items.get(channel + "|" + accountId) ?? null; }
  async save(c: ChannelConnection) { this.items.set(c.channel + "|" + c.accountId, c); }
}

/** Constant-time check of an "sha256=<hex>" HMAC over the exact raw body. */
export function verifyHmacSha256(rawBody: string, signatureHeader: string | undefined, secret: string): boolean {
  if (!secret || typeof signatureHeader !== "string") return false;
  const m = /^sha256=([0-9a-fA-F]{64})$/.exec(signatureHeader.trim());
  if (!m) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const given = Buffer.from(m[1]!, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * WhatsApp Cloud API webhook adapter. Written from Meta's documented payload shape; NOT yet validated against live traffic
 * (needs an approved app) - contract tests cover the documented shape only.
 */
export class WhatsAppCloudProvider implements ChannelProvider {
  readonly channel = "whatsapp" as const;
  constructor(private readonly appSecret: string) {}
  verify(rawBody: string, headers: Readonly<Record<string, string | undefined>>): boolean {
    return verifyHmacSha256(rawBody, headers["x-hub-signature-256"], this.appSecret);
  }
  parse(rawBody: string): readonly InboundMessage[] {
    let body: any;
    try { body = JSON.parse(rawBody); } catch { return []; }
    const out: InboundMessage[] = [];
    for (const entry of Array.isArray(body?.entry) ? body.entry : []) {
      for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
        const value = change?.value;
        const accountId = value?.metadata?.phone_number_id;
        if (typeof accountId !== "string") continue;
        for (const m of Array.isArray(value?.messages) ? value.messages : []) {
          if (typeof m?.id !== "string" || typeof m?.from !== "string") continue;
          const seconds = Number(m.timestamp);
          const receivedAt = Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : new Date().toISOString();
          const isText = m.type === "text" && typeof m.text?.body === "string";
          out.push({ channel: "whatsapp", accountId, externalId: m.id, from: m.from, receivedAt, kind: isText ? "text" : "unsupported", text: isText ? m.text.body : "" });
        }
      }
    }
    return out;
  }
}
