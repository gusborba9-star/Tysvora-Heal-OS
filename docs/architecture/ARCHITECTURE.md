# Tysvora Heal OS — Technical Architecture

**Status:** Architecture specification for CTO review.  
**Execution:** 02 — Technical Architecture.

## 1. Architectural principle

```
TYSVORA HEAL OS
        │
        ▼
     HEAL CORE
        │
 ┌──────┼────────┬──────────┐
 ▼      ▼        ▼          ▼
Modules Engines Intelligence Integrations
        │
        ▼
 Infrastructure
```

Modules consume shared Core capabilities. They must not duplicate identity, users, audit, events, notifications, configuration or tenancy.

## 2. Monorepo

The system is architected as one logical monorepo. A conceptual structure is:

```
apps/         deployable applications and interfaces
packages/     reusable technical/domain packages
modules/      vertical module boundaries
services/     independently deployable/supporting services when justified
infra/        infrastructure definitions and operational configuration
docs/         architectural and governance documentation
```

This is a logical target, not an implementation requirement in this execution. A monorepo tool is not selected yet; the repository and workspace strategy should be chosen during implementation planning based on build isolation, dependency management and deployment needs.

## 3. Technology stack

### TypeScript
**Role:** primary application/domain language.  
**Why:** strong typing, broad ecosystem and consistency across server/client boundaries.  
**Risk:** runtime correctness still requires tests and validation.  
**Alternative:** another strongly typed backend language.  
**Lock-in:** low at domain-contract level if domain logic remains framework-independent.

### React
**Role:** presentation layer.  
**Why:** mature component model and ecosystem.  
**Risk:** UI coupling if business rules are placed in components.  
**Alternative:** another component UI framework.  
**Lock-in:** limited if presentation contracts remain separate from domain/application logic.

### Next.js
**Role:** primary web application framework.  
**Why:** React integration, server capabilities, routing and suitability for a unified platform.  
**Risk:** framework-specific coupling.  
**Alternative:** another TypeScript web framework or separate frontend/backend architecture.  
**Lock-in:** moderate at presentation/application edges; domain packages must remain framework-independent.

### PostgreSQL
**Role:** primary relational database.  
**Why:** transactional integrity, mature SQL, strong isolation primitives and suitability for multi-tenant relational healthcare data.  
**Risk:** operational complexity at scale.  
**Alternative:** another relational database.  
**Lock-in:** moderate at persistence layer; repositories/domain contracts should prevent unnecessary coupling.

### Supabase
**Role:** managed PostgreSQL-centric platform and supporting backend capabilities.  
**Why:** accelerates delivery while retaining PostgreSQL as the core data model.  
**Risk:** provider-specific operational features can create coupling.  
**Alternative:** self-managed PostgreSQL or another managed PostgreSQL provider.  
**Lock-in:** moderate; PostgreSQL remains the portability anchor.

### Vercel
**Role:** primary application deployment platform for the web application, subject to operational fit and future validation.  
**Why:** strong Next.js integration and managed deployment workflow.  
**Risk:** platform-specific deployment/runtime features.  
**Alternative:** another cloud/container platform.  
**Lock-in:** moderate; application must remain deployable independently of provider-specific APIs where practical.

### OpenRouter
**Role:** optional AI provider/router accessed only through the Tysvora AI Gateway.  
**Why:** provider/model breadth and routing flexibility.  
**Risk:** external dependency and policy/availability changes.  
**Alternative:** direct providers or another router.  
**Lock-in:** intentionally low because OpenRouter is not part of the application domain contract.

### GitHub
**Role:** source control, review and project collaboration.  
**Why:** mature Git-based workflow and repository governance.  
**Risk:** workflow/platform dependency.  
**Alternative:** another Git hosting platform.  
**Lock-in:** low at source-code level.

No technology above is a domain authority. The architecture must preserve provider substitution at infrastructure boundaries.

## 4. Layers

- **Presentation:** interfaces, rendering and interaction.
- **Application:** use cases, orchestration, authorization checks and transaction boundaries.
- **Domain:** domain rules and invariants independent of UI/frameworks.
- **Infrastructure:** concrete runtime, persistence and platform mechanisms.
- **Data:** repositories, persistence mappings, migrations and data lifecycle.
- **Integration:** external-system adapters and contracts.
- **AI:** governed AI Gateway and model/provider abstractions.
- **Observability:** logs, metrics, traces, audit and health signals.

Important business rules must not be coupled to the interface.

## 5. Heal Core

The Core provides shared capabilities:

| Component | Responsibility | Dependencies | Consumers | Boundary |
|---|---|---|---|---|
| Identity | identity lifecycle | security infrastructure | all authenticated flows | no clinical decisions |
| Organizations | organizational hierarchy | tenancy | platform/modules | organization scope |
| Tenancy | tenant context/isolation | data/security | all tenant data | tenant boundary |
| Units | operational units | organizations | modules | organization scope |
| Users | human accounts/subjects of access | identity | all modules | access identity |
| Professionals | professional context | users/organizations | assistential modules | professional attributes |
| Patients/Subjects | subject identity/context | tenant/organization | relevant clinical modules | no module-specific rules |
| RBAC | roles/permissions | identity/tenancy | all protected operations | least privilege |
| Audit | security/business traceability | identity/events | all governed components | immutable/auditable intent |
| Events | domain/event publication | tenant context | modules/integrations | event contracts |
| Notifications | notification orchestration | users/events | modules | delivery, not business truth |
| Configuration | tenant/module settings | tenancy | modules | scoped configuration |
| Feature Flags | controlled capability exposure | configuration | platform/modules | not authorization |
| Module Registry | module lifecycle authority | tenancy/configuration | platform/modules | module governance |
| Workflows | stateful process orchestration | events/configuration | modules | process, not UI |
| Search | cross-domain retrieval abstraction | data/indexing | authorized consumers | authorization enforced |
| Documents | document metadata/access abstraction | storage/security | modules | content access governed |
| Observability | technical/business signals | runtime | operators/modules | no sensitive leakage |
| Integrations | external adapters/gateway | integration contracts | modules/Core | no direct external coupling |
| AI Gateway | governed model access | policy/audit | authorized consumers | no autonomous authority |
| Analytics foundation | governed analytical signals | events/data | management/intelligence | controlled data exposure |

## 6. Multi-tenancy

Logical hierarchy:

```
Platform
   │
   ├── Tenant
   │     ├── Organization
   │     │      ├── Units
   │     │      ├── Users
   │     │      └── Modules
   │     │
   │     └── Configuration
   │
   └── Platform Administration
```

- **Platform:** Tysvora-level control plane.
- **Tenant:** isolated customer/organizational boundary.
- **Organization:** organizational entity inside a tenant.
- **Unit:** operational subdivision.
- **User:** identity that accesses the platform.
- **Professional:** user with professional context/attributes.
- **Patient/Subject:** health-related subject, where applicable.

Tenant isolation must be enforced in application authorization and at the PostgreSQL data layer. When PostgreSQL/Supabase is used, Row Level Security (RLS) is a required defense-in-depth mechanism for tenant-scoped data. Exact policy design is implementation work.

## 7. Integration architecture

```
Tysvora
   ↓
Integration Gateway
   ↓
Adapters
   ├── Municipal systems
   ├── External APIs
   ├── Identity systems
   ├── Health systems
   └── Future integrations
```

Core domain code must not directly depend on external API implementations.

## 8. Public and private health

```
Tysvora Heal OS
│
├── Public Health
│   └── Municipal
├── Private Health
│   └── Clinics
└── Networks
```

The Core is shared. Differences should arise through configuration, modules, permissions, workflows, integrations, contracts and policies rather than separate products.

## 9. Observability

The architecture distinguishes:

- **Technical Observability:** logs, metrics, traces, health and errors.
- **Security Audit:** access, privilege and security-relevant actions.
- **Clinical/Business Audit:** governed traceability of business/clinical operations.

All three require appropriate access control and data minimization.

## 10. Decision pending

**DECISION PENDING — High availability topology, definitive observability providers, search engine, document storage implementation, analytics engine, partitioning strategy, event broker and exact municipal deployment topology.**

These remain open because they depend on workload, compliance, cost and operational evidence that should be established before committing the architecture.
