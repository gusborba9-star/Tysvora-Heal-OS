# Tysvora Heal OS — Domain Model

## Scope

This is a conceptual domain model. It defines ownership and boundaries, not SQL schemas.

| Entity | Purpose | Relationship | Owner | Scope |
|---|---|---|---|---|
| Tenant | customer isolation boundary | contains organizations/configuration | Core | Tenant |
| Organization | organizational identity | belongs to tenant; contains units | Core | Tenant |
| Unit | operational location/entity | belongs to organization | Core | Tenant |
| User | access identity | belongs to tenant/context | Core | Tenant |
| Professional | professional context | associated with user/organization | Core | Tenant |
| Patient/Subject | person/subject receiving applicable services | belongs to tenant | Core + clinical context | Tenant |
| Role | reusable authorization grouping | assigned to users | Core | Tenant/platform |
| Permission | atomic authorization capability | grouped by roles | Core | Platform/Tenant |
| Module | capability package | registered by Module Registry | Core | Platform |
| ModuleVersion | immutable module release identity | belongs to module | Core | Platform |
| ModuleActivation | tenant-specific module state | references module/version and tenant | Core | Tenant |
| Contract | commercial/operational authorization | governs contracted capabilities | Core | Tenant |
| Configuration | scoped settings | platform/tenant/module/unit scopes | Core | Scoped |
| Event | fact emitted by system | source/correlation/tenant context | Core | Tenant/platform |
| Workflow | process state/orchestration | consumes events and invokes capabilities | Core + modules | Scoped |
| AuditEntry | traceable governed action | actor/resource/context | Core | Tenant/platform |
| Notification | delivery intent/status | targets users/subjects | Core | Tenant |
| Integration | external-system connection definition | belongs to tenant/platform context | Core | Scoped |
| AIRequest | governed AI invocation record | links context/policy/cost | AI Gateway | Tenant |
| AIResponse | model output/result metadata | belongs to AIRequest | AI Gateway | Tenant |
| Document | metadata/access reference for files | owned by domain subject | Core + modules | Tenant |

### Ownership rules

Core owns cross-cutting identity, tenancy, authorization, audit and module lifecycle. Modules own module-specific domain rules and data. Modules must not redefine global tenant boundaries or security invariants.

Patient/Subject is a Core concept only to the extent required for cross-module identity/context. Clinical semantics remain in the relevant bounded context.

No entity definition authorizes a production table in this execution.
