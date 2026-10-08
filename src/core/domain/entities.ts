import { EntityId, requireNonEmpty } from "../../shared/ids.js";

export interface Tenant { readonly id: EntityId; readonly name: string; }
export interface Organization { readonly id: EntityId; readonly tenantId: EntityId; readonly name: string; }
export interface Unit { readonly id: EntityId; readonly organizationId: EntityId; readonly name: string; }
export interface Identity { readonly id: EntityId; readonly subject: string; }
export interface User { readonly id: EntityId; readonly tenantId: EntityId; readonly identityId: EntityId; readonly displayName: string; }
export interface Professional { readonly id: EntityId; readonly tenantId: EntityId; readonly userId: EntityId; readonly organizationId: EntityId; }
export interface Subject { readonly id: EntityId; readonly tenantId: EntityId; readonly organizationId: EntityId; readonly displayName: string; }

export function createTenant(input: Tenant): Tenant { return { id: requireNonEmpty(input.id,"tenant.id"), name: requireNonEmpty(input.name,"tenant.name") }; }
export function createOrganization(input: Organization): Organization { return { id: requireNonEmpty(input.id,"organization.id"), tenantId: requireNonEmpty(input.tenantId,"organization.tenantId"), name: requireNonEmpty(input.name,"organization.name") }; }
export function createUnit(input: Unit): Unit { return { id: requireNonEmpty(input.id,"unit.id"), organizationId: requireNonEmpty(input.organizationId,"unit.organizationId"), name: requireNonEmpty(input.name,"unit.name") }; }
export function createIdentity(input: Identity): Identity { return { id: requireNonEmpty(input.id,"identity.id"), subject: requireNonEmpty(input.subject,"identity.subject") }; }
export function createUser(input: User): User { return { id: requireNonEmpty(input.id,"user.id"), tenantId: requireNonEmpty(input.tenantId,"user.tenantId"), identityId: requireNonEmpty(input.identityId,"user.identityId"), displayName: requireNonEmpty(input.displayName,"user.displayName") }; }
export function createProfessional(input: Professional): Professional { return { id: requireNonEmpty(input.id,"professional.id"), tenantId: requireNonEmpty(input.tenantId,"professional.tenantId"), userId: requireNonEmpty(input.userId,"professional.userId"), organizationId: requireNonEmpty(input.organizationId,"professional.organizationId") }; }
export function createSubject(input: Subject): Subject { return { id: requireNonEmpty(input.id,"subject.id"), tenantId: requireNonEmpty(input.tenantId,"subject.tenantId"), organizationId: requireNonEmpty(input.organizationId,"subject.organizationId"), displayName: requireNonEmpty(input.displayName,"subject.displayName") }; }
