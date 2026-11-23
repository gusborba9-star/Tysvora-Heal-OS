import { EntityId } from "../../../shared/ids.js";
import { ProgramDefinition, ProgramEnrollment, ProgramFact } from "../../../program/domain.js";
import { Pendency } from "../../../program/pendency.js";
import { PostgresDatabase } from "./database.js";

type Row = Record<string, any>;

/**
 * Program-engine aggregates are stored as one validated JSON document plus the columns the database must index or enforce.
 * The document is the source of truth for the entity; columns are derived from it on every save.
 */
export abstract class PgDocRepository<T extends { readonly id: EntityId; readonly tenantId: EntityId }> {
  protected abstract readonly table: string;
  /** Extra columns derived from the entity, in the same order as `extraColumns`. */
  protected abstract readonly extraColumns: readonly string[];
  protected abstract extras(entity: T): readonly unknown[];
  constructor(protected readonly db: PostgresDatabase) {}

  async save(entity: T): Promise<void> {
    const cols = ["id", "tenant_id", ...this.extraColumns, "doc"];
    const placeholders = cols.map((_, i) => "$" + (i + 1)).join(", ");
    const updatable = [...this.extraColumns, "doc"].map(c => `${c} = excluded.${c}`).join(", ");
    await this.db.withScope({ tenantId: entity.tenantId }, q => q.query(
      `insert into heal.${this.table} (${cols.join(", ")}) values (${placeholders}) on conflict (id) do update set ${updatable}`,
      [entity.id, entity.tenantId, ...this.extras(entity), JSON.stringify(entity)]));
  }
  async getInTenant(tenantId: string, id: EntityId): Promise<T | null> {
    const r = await this.db.withScope({ tenantId }, q => q.query<Row>(`select doc from heal.${this.table} where tenant_id = $1 and id = $2`, [tenantId, id]));
    return r.rows[0] ? (r.rows[0].doc as T) : null;
  }
  async listInTenant(tenantId: string): Promise<T[]> {
    const r = await this.db.withScope({ tenantId }, q => q.query<Row>(`select doc from heal.${this.table} where tenant_id = $1 order by created_at, id`, [tenantId]));
    return r.rows.map(x => x.doc as T);
  }
  async getById(id: EntityId): Promise<T | null> {
    const r = await this.db.withScope({ platform: true }, q => q.query<Row>(`select doc from heal.${this.table} where id = $1`, [id]));
    return r.rows[0] ? (r.rows[0].doc as T) : null;
  }
}

export class PgProgramDefinitionRepository extends PgDocRepository<ProgramDefinition> {
  protected readonly table = "program_definitions";
  protected readonly extraColumns = ["organization_id", "program_key", "version", "status"];
  protected extras(e: ProgramDefinition) { return [e.organizationId, e.key, e.version, e.status]; }
}
export class PgProgramEnrollmentRepository extends PgDocRepository<ProgramEnrollment> {
  protected readonly table = "program_enrollments";
  protected readonly extraColumns = ["organization_id", "subject_id", "program_key", "definition_id", "status"];
  protected extras(e: ProgramEnrollment) { return [e.organizationId, e.subjectId, e.programKey, e.definitionId, e.status]; }
}
export class PgProgramFactRepository extends PgDocRepository<ProgramFact> {
  protected readonly table = "program_facts";
  protected readonly extraColumns = ["enrollment_id", "kind", "occurred_at"];
  protected extras(e: ProgramFact) { return [e.enrollmentId, e.kind, e.occurredAt]; }
}
export class PgPendencyRepository extends PgDocRepository<Pendency> {
  protected readonly table = "pendencies";
  protected readonly extraColumns = ["organization_id", "subject_id", "state", "dedup_key", "version", "due_at"];
  protected extras(e: Pendency) { return [e.organizationId, e.subjectId, e.state, e.dedupKey ?? null, e.version, e.dueAt]; }
}

import { ConsentRecord, ContactBinding } from "../../../care/consent.js";
import { PatientDemand } from "../../../care/demand.js";
import { ChannelConnection, ChannelConnectionRepository } from "../../../care/channel.js";

export class PgConsentRepository extends PgDocRepository<ConsentRecord> {
  protected readonly table = "consent_records";
  protected readonly extraColumns = ["subject_id", "channel", "purpose", "status"];
  protected extras(e: ConsentRecord) { return [e.subjectId, e.channel, e.purpose, e.status]; }
}
export class PgContactBindingRepository extends PgDocRepository<ContactBinding> {
  protected readonly table = "contact_bindings";
  protected readonly extraColumns = ["subject_id", "channel", "address_key", "status"];
  protected extras(e: ContactBinding) { return [e.subjectId, e.channel, e.addressKey, e.status]; }
}
export class PgDemandRepository extends PgDocRepository<PatientDemand> {
  protected readonly table = "patient_demands";
  protected readonly extraColumns = ["organization_id", "subject_id", "channel", "external_id", "status", "received_at"];
  protected extras(e: PatientDemand) { return [e.organizationId, e.subjectId ?? null, e.channel, e.externalId, e.status, e.receivedAt]; }
}

/** Channel connections are resolved by the external account before the tenant is known: an explicit platform-mode READ. */
export class PgChannelConnectionRepository implements ChannelConnectionRepository {
  constructor(private readonly db: PostgresDatabase) {}
  async findByAccount(channel: ChannelConnection["channel"], accountId: string): Promise<ChannelConnection | null> {
    const r = await this.db.withScope({ platform: true }, q => q.query<Row>("select * from heal.channel_connections where channel = $1 and account_id = $2", [channel, accountId]));
    const x = r.rows[0];
    return x ? { id: x.id, tenantId: x.tenant_id, organizationId: x.organization_id, channel: x.channel, accountId: x.account_id, serviceUserId: x.service_user_id, secretRef: x.secret_ref ?? undefined, status: x.status } : null;
  }
  async save(c: ChannelConnection): Promise<void> {
    await this.db.withScope({ tenantId: c.tenantId }, q => q.query(
      "insert into heal.channel_connections (id, tenant_id, organization_id, channel, account_id, service_user_id, secret_ref, status) values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do update set status = excluded.status, secret_ref = excluded.secret_ref, service_user_id = excluded.service_user_id",
      [c.id, c.tenantId, c.organizationId, c.channel, c.accountId, c.serviceUserId, c.secretRef ?? null, c.status]));
  }
}
