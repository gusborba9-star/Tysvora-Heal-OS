# Tysvora Heal OS — Heal Core Foundation

## Execution 03

This document records the executable boundary established by the Heal Core foundation.

### Implemented

- Tenant, Organization and Unit domain contracts.
- Identity separated from User, Professional and Subject.
- Explicit tenancy/request context with tenant, organization, unit, actor and correlation identifiers.
- RBAC contracts for Role, Permission, RolePermission and scoped UserRole assignments.
- Contextual Configuration contract for platform, tenant, organization, unit and module scopes.
- AuditEntry contract without persistent storage.
- Versioned DomainEvent contract and EventPublisher abstraction.
- In-memory event publisher for deterministic tests only.
- Repository and identity-provider abstractions with no concrete external provider.
- Minimal deterministic unit tests for the Core contracts.

### Deliberately excluded

No database, migrations, RLS, authentication provider, API, UI, external service, broker, module registry, vertical module, clinical engine, Sentinela, AI Gateway or deployment was implemented.

The Core remains independent of vertical modules and persistence technology.
