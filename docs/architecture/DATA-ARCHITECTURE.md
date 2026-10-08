# Tysvora Heal OS — Data Architecture

## 1. Primary data platform

**PostgreSQL** is the primary transactional database.

Reasons: transactional consistency, relational modeling, mature indexing, strong authorization primitives and suitability for multi-tenant healthcare workloads.

**Supabase** is the initial managed PostgreSQL platform choice. PostgreSQL remains the portability anchor.

## 2. Logical organization

Initial strategy: **domain-oriented PostgreSQL schemas**, with explicit separation between Core and module-owned domains.

Conceptually:

```
core.*
module_<name>.*
```

This is preferred over placing every domain in one shared schema because it makes ownership, migration boundaries, permissions and dependency review more explicit while retaining one transactional database.

The exact schema names and SQL objects are implementation decisions.

## 3. Tenancy

Tenant context must be present for tenant-owned data. Isolation is enforced at application authorization and database authorization layers. RLS is required defense in depth when PostgreSQL/Supabase is used.

No module may create data structures that violate global tenancy, audit or security rules of the Core.

## 4. Data classes

- **Core data:** identity, tenancy, organizations, configuration, module lifecycle.
- **Clinical data:** patient/subject and clinical-domain information.
- **Operational data:** inventory, scheduling, workflows and operational states.
- **Audit data:** security and business traceability.
- **Analytical data:** derived indicators and analytical structures.
- **Documents/files:** metadata in the database and binary content in an appropriate storage layer.

Clinical and sensitive data must not be replicated into analytics without an explicit governance purpose and access policy.

## 5. Migrations

Database migrations must be versioned, reviewable and reproducible. Module migrations must respect Core contracts and tenant isolation.

No production tables are created in this execution.

## 6. Retention and lifecycle

Retention must be policy-driven by data class, legal/regulatory requirements and contractual context. Deletion, archival and anonymization must be designed per class rather than through a universal rule.

## 7. Backups and recovery

Backups, point-in-time recovery where supported, restore testing and disaster-recovery procedures are mandatory operational concerns before production.

**DECISION PENDING:** exact RPO/RTO targets and backup provider/topology.

## 8. Indexing and partitioning

Indexes must be driven by validated query patterns and tenant-aware access paths.

**DECISION PENDING:** partitioning strategy. It should be introduced only when measured volume, retention or query behavior justifies it.

## 9. Documents and files

Database records should contain metadata and authorization references; binary storage should be separated from transactional relational data.

**DECISION PENDING:** definitive object-storage implementation.

## 10. Analytics

Analytical workloads should not compromise transactional workloads.

**DECISION PENDING:** definitive analytics architecture/engine and whether/when a separate analytical store is justified.
