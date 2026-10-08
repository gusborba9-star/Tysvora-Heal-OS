# Tysvora Heal OS — Module Architecture

## 1. Principle

A module is a bounded capability package built on shared Core contracts. It is not a separate product and must not duplicate Core identity, tenancy, authorization or audit.

## 2. Module contract

Each module must conceptually declare:

- Module;
- Module Manifest;
- Module Version;
- Module Dependencies;
- Module Permissions;
- Module Configuration;
- Module Routes;
- Module Events;
- Module Data;
- Module Integrations;
- Module Health;
- Module Lifecycle.

## 3. Lifecycle

```
AVAILABLE
   ↓
CONTRACTED
   ↓
CONFIGURING
   ↓
HOMOLOGATING
   ↓
ACTIVE
   ↓
SUSPENDED
   ↓
DEACTIVATED
```

Transitions must be controlled and auditable.

## 4. Module Registry

The Module Registry is the authority for:

- existence;
- version;
- dependencies;
- availability;
- configuration;
- activation state.

It does not replace commercial contracts or operational homologation; it records and enforces the technical state permitted by them.

## 5. Dependencies

Modules must declare dependencies. Example:

```
Tysvora Vacinas
 ├── Identity
 ├── Patient Context
 ├── Notifications
 └── Integration Gateway
```

The example is conceptual.

## 6. Data ownership

A module owns its domain data within global Core tenancy, security and audit constraints. It cannot redefine tenant boundaries.

## 7. Routes and events

Modules expose domain-oriented routes and publish/consume governed events. Route names and event contracts must be versioned.

## 8. Health

Each module must expose a standardized health/status concept sufficient for Module Registry and operations to determine whether it is available and healthy.

## 9. Configuration

Module configuration is scoped to the appropriate tenant/organization/unit and must not be confused with authorization.

## 10. No-fork principle

Municipal or private variations should be represented by configuration, policies, workflows, integrations and module activation whenever the underlying capability is the same. Forking the application for a customer is an exception requiring explicit architectural approval.
