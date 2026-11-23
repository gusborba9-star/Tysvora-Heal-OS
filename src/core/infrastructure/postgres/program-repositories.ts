import { EntityId } from "../../../shared/ids.js";
import { ProgramDefinition, ProgramEnrollment, ProgramFact } from "../../../program/domain.js";
import { Pendency } from "../../../program/pendency.js";
import { PostgresDatabase } from "./database.js";

type Row = Record<string, any>;

/**
 * Program-engine aggregates are stored as one validated JSON document plus the columns the database must index or enforce.
 * The document is the source of truth for the entity; columns are derived from it on every save.
 */
abstract class PgDocRepository<T extends { readonly id: EntityId; readonly tenantId: EntityId }> {
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
