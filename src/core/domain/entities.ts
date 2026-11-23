import { EntityId, PLATFORM_SCOPE_ID, requireNonEmpty, requireId, requireName } from "../../shared/ids.js";
import { DomainInvariantError } from "./errors.js";

export interface Tenant { readonly id: EntityId; readonly name: string; }
export interface Organization { readonly id: EntityId; readonly tenantId: EntityId; readonly name: string; }
export interface Unit { readonly id: EntityId; readonly tenantId: EntityId; readonly organizationId: EntityId; readonly name: string; }
export interface Identity { readonly id: EntityId; readonly subject: string; }
export interface User { readonly id: EntityId; readonly tenantId: EntityId; readonly identityId: EntityId; readonly displayName: string; }
export interface Professional { readonly id: EntityId; readonly tenantId: EntityId; readonly userId: EntityId; readonly organizationId: EntityId; }
export interface Subject { readonly id: EntityId; readonly tenantId: EntityId; readonly organizationId: EntityId; readonly displayName: string; }

export function createTenant(input: Tenant): Tenant {
  if (input.id === PLATFORM_SCOPE_ID) throw new DomainInvariantError("tenant.id is reserved for the platform scope");
  return { id: requireId(input.id,"tenant.id"), name: requireName(input.name,"tenant.name") };
}

export function createOrganization(input: Organization, tenant: Tenant): Organization {
  if (input.tenantId !== tenant.id) throw new DomainInvariantError("organization.tenantId must match its tenant");
  return { id: requireId(input.id,"organization.id"), tenantId: tenant.id, name: requireName(input.name,"organization.name") };
}

export function createUnit(input: Unit, organization: Organization): Unit {
  if (input.tenantId !== organization.tenantId) throw new DomainInvariantError("unit.tenantId must match its organization tenant");
  if (input.organizationId !== organization.id) throw new DomainInvariantError("unit.organizationId must match its organization");
  return {
    id: requireId(input.id,"unit.id"),
    tenantId: organization.tenantId,
    organizationId: organization.id,
    name: requireName(input.name,"unit.name")
  };
}

export function createIdentity(input: Identity): Identity {
  return { id: requireId(input.id,"identity.id"), subject: requireNonEmpty(input.subject,"identity.subject") };
}

export function createUser(input: User, tenant: Tenant): User {
  if (input.tenantId !== tenant.id) throw new DomainInvariantError("user.tenantId must match its tenant");
  return {
    id: requireId(input.id,"user.id"),
    tenantId: tenant.id,
    identityId: requireId(input.identityId,"user.identityId"),
    displayName: requireName(input.displayName,"user.displayName")
  };
}

export function createProfessional(input: Professional, user: User, organization: Organization): Professional {
  if (input.tenantId !== user.tenantId || input.tenantId !== organization.tenantId) {
    throw new DomainInvariantError("professional tenant must match user and organization tenants");
  }
  if (input.userId !== user.id) throw new DomainInvariantError("professional.userId must match its user");
  if (input.organizationId !== organization.id) throw new DomainInvariantError("professional.organizationId must match its organization");
  return {
    id: requireId(input.id,"professional.id"),
    tenantId: user.tenantId,
    userId: user.id,
    organizationId: organization.id
  };
}

export function createSubject(input: Subject, organization: Organization): Subject {
  if (input.tenantId !== organization.tenantId) throw new DomainInvariantError("subject tenant must match organization tenant");
  if (input.organizationId !== organization.id) throw new DomainInvariantError("subject.organizationId must match its organization");
  return {
    id: requireId(input.id,"subject.id"),
    tenantId: organization.tenantId,
    organizationId: organization.id,
    displayName: requireName(input.displayName,"subject.displayName")
  };
}
