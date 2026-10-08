# Heal Core — Application Layer

## Responsibility

The Application Layer orchestrates Heal Core use cases. It coordinates authorization, tenancy context, repository contracts, domain construction, audit and event publication without owning the domain invariants.

## Boundary

Domain → Application → Contracts / Ports → Infrastructure.

Application Services do not import PostgreSQL, Supabase, Vercel, OpenRouter, an ORM or external authentication providers.

## Use cases

The current application boundary covers creation/read/assignment operations for Tenant, Organization, Unit, User, Professional, Subject, Role and UserRole. It intentionally does not implement complete CRUD.

## Tenancy

Application contexts explicitly distinguish platform operations from tenant-scoped operations. Tenant, organization and unit identifiers supplied by commands are checked against the request context before domain construction.

The domain remains responsible for the fundamental entity invariants established in Execution 03A.

## Authorization

AuthorizationService is a port. This execution establishes the boundary and tests allow/deny behavior; it does not introduce a complete permission matrix or external identity provider.

## Audit and events

Relevant successful operations create AuditEntry values through AuditSink and publish DomainEvent values through EventPublisher. The existing in-memory event publisher remains the only event implementation.

## Persistence

Repositories are contracts only. In-memory repositories exist for deterministic tests and are not production persistence.

## Current limits

No database, external authentication, module registry, vertical module, AI gateway, integration gateway, analytics or deployment infrastructure is implemented here.
