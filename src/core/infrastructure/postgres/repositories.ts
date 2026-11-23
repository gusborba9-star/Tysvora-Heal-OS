import { EntityId } from "../../../shared/ids.js";
import { PLATFORM_SCOPE_ID } from "../../../shared/ids.js";
import { AuditEntry } from "../../domain/audit.js";
import { DomainEvent } from "../../domain/event.js";
import { Tenant, Organization, Unit, User, Professional, Subject } from "../../domain/entities.js";
import { Role, UserRole, RoleAssignmentScope, ArchitecturalRole } from "../../domain/access.js";
import { AuditSink, OrganizationRepository, UnitRepository, UserRepository, ProfessionalRepository, SubjectRepository, RoleRepository, UserRoleRepository, TenantRepository } from "../../contracts/application.js";
import { EventPublisher } from "../../contracts/core.js";
import { userRoleKey } from "../in-memory-repositories.js";
import { PostgresDatabase, Querier } from "./database.js";

type Row = Record<string, any>;

/** Generic tenant-owned table access. Table and column names are code constants, never input. */
export abstract class PgTenantRepository<T extends { readonly id: EntityId; readonly tenantId: EntityId }> {
  protected abstract readonly table: string;
  protected abstract readonly columns: readonly string[];
  protected abstract toValues(entity: T): readonly unknown[];
  protected abstract fromRow(row: Row): T;
  constructor(protected readonly db: PostgresDatabase) {}

  private get cols(): string { return this.columns.join(", "); }

  async save(entity: T): Promise<void> {
    const placeholders = this.columns.map((_, i) => "$" + (i + 1)).join(", ");
    // tenant_id and id are never updated: a conflicting row of another tenant is rejected by RLS, not overwritten.
    const updatable = this.columns.filter(c => c !== "id" && c !== "tenant_id").map(c => `${c} = excluded.${c}`).join(", ");
    await this.db.withScope({ tenantId: entity.tenantId }, q => q.query(
      `insert into heal.${this.table} (${this.cols}) values (${placeholders}) on conflict (id) do update set ${updatable}`, this.toValues(entity)));
  }
  async getInTenant(tenantId: string, id: EntityId): Promise<T | null> {
    const r = await this.db.withScope({ tenantId }, q => q.query(`select ${this.cols} from heal.${this.table} where tenant_id = $1 and id = $2`, [tenantId, id]));
    return r.rows[0] ? this.fromRow(r.rows[0]) : null;
  }
  async listInTenant(tenantId: string): Promise<T[]> {
    const r = await this.db.withScope({ tenantId }, q => q.query(`select ${this.cols} from heal.${this.table} where tenant_id = $1 order by created_at, id`, [tenantId]));
    return r.rows.map(row => this.fromRow(row));
  }
  async countInTenant(tenantId: string): Promise<number> {
    const r = await this.db.withScope({ tenantId }, q => q.query<{ n: string }>(`select count(*)::text as n from heal.${this.table} where tenant_id = $1`, [tenantId]));
    return Number(r.rows[0]?.n ?? 0);
  }
  /** Unscoped lookup required by the Repository contract: explicit platform-mode READ. Application code uses getInTenant. */
  async getById(id: EntityId): Promise<T | null> {
    const r = await this.db.withScope({ platform: true }, q => q.query(`select ${this.cols} from heal.${this.table} where id = $1`, [id]));
    return r.rows[0] ? this.fromRow(r.rows[0]) : null;
  }
}

export class PgOrganizationRepository extends PgTenantRepository<Organization> implements OrganizationRepository {
  protected readonly table = "organizations"; protected readonly columns = ["id", "tenant_id", "name"];
  protected toValues(e: Organization) { return [e.id, e.tenantId, e.name]; }
  protected fromRow(r: Row): Organization { return { id: r.id, tenantId: r.tenant_id, name: r.name }; }
}
export class PgUnitRepository extends PgTenantRepository<Unit> implements UnitRepository {
  protected readonly table = "units"; protected readonly columns = ["id", "tenant_id", "organization_id", "name"];
  protected toValues(e: Unit) { return [e.id, e.tenantId, e.organizationId, e.name]; }
  protected fromRow(r: Row): Unit { return { id: r.id, tenantId: r.tenant_id, organizationId: r.organization_id, name: r.name }; }
}
export class PgUserRepository extends PgTenantRepository<User> implements UserRepository {
  protected readonly table = "users"; protected readonly columns = ["id", "tenant_id", "identity_id", "display_name"];
  protected toValues(e: User) { return [e.id, e.tenantId, e.identityId, e.displayName]; }
  protected fromRow(r: Row): User { return { id: r.id, tenantId: r.tenant_id, identityId: r.identity_id, displayName: r.display_name }; }
}
export class PgProfessionalRepository extends PgTenantRepository<Professional> implements ProfessionalRepository {
  protected readonly table = "professionals"; protected readonly columns = ["id", "tenant_id", "user_id", "organization_id"];
  protected toValues(e: Professional) { return [e.id, e.tenantId, e.userId, e.organizationId]; }
  protected fromRow(r: Row): Professional { return { id: r.id, tenantId: r.tenant_id, userId: r.user_id, organizationId: r.organization_id }; }
}
export class PgSubjectRepository extends PgTenantRepository<Subject> implements SubjectRepository {
  protected readonly table = "subjects"; protected readonly columns = ["id", "tenant_id", "organization_id", "display_name"];
  protected toValues(e: Subject) { return [e.id, e.tenantId, e.organizationId, e.displayName]; }
  protected fromRow(r: Row): Subject { return { id: r.id, tenantId: r.tenant_id, organizationId: r.organization_id, displayName: r.display_name }; }
}

export class PgTenantsRepository implements TenantRepository {
  constructor(private readonly db: PostgresDatabase) {}
  async save(entity: Tenant): Promise<void> {
    await this.db.withScope({ tenantId: entity.id }, q => q.query(
      "insert into heal.tenants (id, name) values ($1, $2) on conflict (id) do update set name = excluded.name", [entity.id, entity.name]));
  }
  /** A tenant is looked up as itself, so no platform mode is needed. */
  async getById(id: EntityId): Promise<Tenant | null> {
    const r = await this.db.withScope({ tenantId: id }, q => q.query("select id, name from heal.tenants where id = $1", [id]));
    return r.rows[0] ? { id: r.rows[0].id, name: r.rows[0].name } : null;
  }
}

export class PgRoleRepository implements RoleRepository {
  constructor(private readonly db: PostgresDatabase) {}
  async save(entity: Role): Promise<void> {
    const scope = entity.tenantId ? { tenantId: entity.tenantId } : { platform: true as const };
    await this.db.withScope(scope, q => q.query(
      "insert into heal.roles (id, tenant_id, name, architectural_role) values ($1, $2, $3, $4) on conflict (id) do update set name = excluded.name, architectural_role = excluded.architectural_role",
      [entity.id, entity.tenantId ?? null, entity.name, entity.architecturalRole ?? null]));
  }
  /** Roles are resolved before the owning tenant is known (authorization): explicit platform-mode READ; callers enforce ownership. */
  async getById(id: EntityId): Promise<Role | null> {
    const r = await this.db.withScope({ platform: true }, q => q.query("select id, name, architectural_role, tenant_id from heal.roles where id = $1", [id]));
    const row = r.rows[0];
    return row ? { id: row.id, name: row.name, architecturalRole: (row.architectural_role ?? undefined) as ArchitecturalRole | undefined, tenantId: row.tenant_id ?? undefined } : null;
  }
}

export class PgUserRoleRepository implements UserRoleRepository {
  constructor(private readonly db: PostgresDatabase) {}
  async save(entity: UserRole): Promise<void> {
    const s = entity.scope;
    const dbScope = s.level === "platform" ? { platform: true as const } : { tenantId: s.tenantId };
    await this.db.withScope(dbScope, q => q.query(
      `insert into heal.user_roles (user_id, role_id, scope_level, tenant_id, organization_id, unit_id, scope_key)
       values ($1, $2, $3, $4, $5, $6, $7) on conflict (user_id, role_id, scope_key) do nothing`,
      [entity.userId, entity.roleId, s.level, s.level === "platform" ? null : s.tenantId, s.level === "organization" || s.level === "unit" ? s.organizationId : null, s.level === "unit" ? s.unitId : null, userRoleKey(entity)]));
  }
  async getById(id: string): Promise<UserRole | null> {
    const r = await this.db.withScope({ platform: true }, q => q.query("select * from heal.user_roles where scope_key = $1 limit 1", [id]));
    return r.rows[0] ? this.fromRow(r.rows[0]) : null;
  }
  /** Authorization needs every assignment of the actor, including platform-level ones: explicit platform-mode READ. */
  async listForUser(userId: string): Promise<readonly UserRole[]> {
    const r = await this.db.withScope({ platform: true }, q => q.query("select * from heal.user_roles where user_id = $1", [userId]));
    return r.rows.map(row => this.fromRow(row));
  }
  private fromRow(r: Row): UserRole {
    const scope: RoleAssignmentScope = r.scope_level === "platform" ? { level: "platform" }
      : r.scope_level === "tenant" ? { level: "tenant", tenantId: r.tenant_id }
      : r.scope_level === "organization" ? { level: "organization", tenantId: r.tenant_id, organizationId: r.organization_id }
      : { level: "unit", tenantId: r.tenant_id, organizationId: r.organization_id, unitId: r.unit_id };
    return { userId: r.user_id, roleId: r.role_id, scope };
  }
}

export class PgAuditSink implements AuditSink {
  constructor(private readonly db: PostgresDatabase) {}
  async append(e: AuditEntry): Promise<void> {
    await this.db.withScope({ tenantId: e.tenantId }, q => q.query(
      "insert into heal.audit_log (id, tenant_id, actor_id, action, resource, resource_id, occurred_at, correlation_id, result, metadata) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [e.id, e.tenantId, e.actorId ?? null, e.action, e.resource, e.resourceId ?? null, e.timestamp, e.correlationId ?? null, e.result, e.metadata === undefined ? null : JSON.stringify(e.metadata)]));
  }
  async list(tenantId: string): Promise<AuditEntry[]> {
    const r = await this.db.withScope({ tenantId }, q => q.query("select * from heal.audit_log where tenant_id = $1 order by occurred_at, id", [tenantId]));
    return r.rows.map(x => ({ id: x.id, tenantId: x.tenant_id, actorId: x.actor_id ?? undefined, action: x.action, resource: x.resource, resourceId: x.resource_id ?? undefined, timestamp: new Date(x.occurred_at).toISOString(), correlationId: x.correlation_id ?? undefined, result: x.result, metadata: x.metadata ?? undefined }));
  }
}

/** Transactional outbox: events are stored with the state change; a relay (later stage) delivers them and stamps published_at. */
export class PgEventPublisher implements EventPublisher {
  constructor(private readonly db: PostgresDatabase) {}
  async publish<TPayload>(e: DomainEvent<TPayload>): Promise<void> {
    await this.db.withScope({ tenantId: e.tenantId }, q => q.query(
      "insert into heal.domain_events (event_id, tenant_id, event_type, version, occurred_at, actor_id, source, correlation_id, payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [e.eventId, e.tenantId, e.eventType, e.version, e.occurredAt, e.actorId ?? null, e.source, e.correlationId ?? null, JSON.stringify(e.payload ?? null)]));
  }
  async listForTenant(tenantId: string): Promise<DomainEvent[]> {
    const r = await this.db.withScope({ tenantId }, q => q.query("select * from heal.domain_events where tenant_id = $1 order by occurred_at, event_id", [tenantId]));
    return r.rows.map(x => ({ eventId: x.event_id, eventType: x.event_type, version: x.version, occurredAt: new Date(x.occurred_at).toISOString(), tenantId: x.tenant_id, actorId: x.actor_id ?? undefined, source: x.source, correlationId: x.correlation_id ?? undefined, payload: x.payload }));
  }
}
export { PLATFORM_SCOPE_ID };
export type { Querier };
