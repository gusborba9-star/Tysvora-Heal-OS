import { EntityId } from "../../shared/ids.js";
import { Repository } from "./core.js";
import { AuditEntry } from "../domain/audit.js";
import { Tenant, Organization, Unit, User, Professional, Subject } from "../domain/entities.js";
import { Role, UserRole } from "../domain/access.js";

export interface TenantRepository extends Repository<Tenant> {}
export interface OrganizationRepository extends Repository<Organization> {}
export interface UnitRepository extends Repository<Unit> {}
export interface UserRepository extends Repository<User> {}
export interface ProfessionalRepository extends Repository<Professional> {}
export interface SubjectRepository extends Repository<Subject> {}
export interface RoleRepository extends Repository<Role> {}
export interface UserRoleRepository extends Repository<UserRole> {}

export interface AuditSink { append(entry: AuditEntry): Promise<void>; }
export interface IdGenerator { next(): EntityId; }
export interface Clock { now(): string; }
