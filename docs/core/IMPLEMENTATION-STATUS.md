# Implementation status (Heal Core + Program Engine v0)

Single source of truth for what exists in `src/` and how it was verified. Documents in `docs/` describe the target; this file describes the code.

## Verification

`npm test` builds and runs every suite with the Node test runner (36 tests). CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm test` and `npm audit --audit-level=high`.
Tests were mutation-checked: removing each guard below makes at least one test fail.

## Core hardening (audit findings P1–P10)

| # | Finding | Fix |
| --- | --- | --- |
| P1 | Tenant context could create/assign platform-level roles | Platform-level architectural roles are created and assigned only in platform context, at platform scope |
| P2 | `assignRole` ignored the acting organization/unit | Acting context must cover the granted scope |
| P3 | Policy did not see the assignment target | `AuthorizationRequest.attributes` carries role, user and scope |
| P4 | `getTenant` revealed tenant existence | Foreign tenant and missing tenant return the same `NotFoundError` |
| P5 | Refusals were not audited | Denials, policy errors and tenancy violations are audited as `failure`; audit errors never mask the refusal |
| P6 | Save without audit possible | `UnitOfWork` makes state, audit and event atomic and serialized (in-memory: snapshot/restore; real DB: transaction/outbox) |
| P7 | Users could point to non-existent identities | `IdentityProvider` is resolved before a user is created |
| P8 | Reads were not tenant-scoped | `getInTenant(tenantId, id)` used everywhere; ids are strict tokens |
| P9 | Validation only checked "not empty" | Length limits, NFC normalization, control/invisible/bidi characters and angle brackets rejected; escape again at every output edge |
| P10 | Same role at two scopes overwrote the earlier assignment | User-role key includes scope |

## Program Engine v0 (`src/program/`)

- Declarative, versioned program definitions with four-eyes approval (author cannot approve). Enrollments pin the approved version; new versions never rewrite history.
- Continuity rules (`missed-appointments`, `overdue-exam`, `unanswered-demand`) evaluated by a pure, deterministic Sentinela (`assessContinuity`) that explains rule set version, evidence, and limitations. It is not a clinical assessment (Blueprint §33).
- Central de Pendências: lifecycle (assign, accept, transfer, justified pause, resume, escalate, resolve, close, reopen) with full history, SLA, queue and priority ordering (Blueprint §31). One open continuity pendency per enrollment, race-free.
- Tenant and organization isolation on every operation; every operation is authorized and audited.
- Same engine runs different programs by configuration only (diabetes and veterinary vaccine return are both tested).

## RBAC, owned roles and entitlements (Etapa 3)
- `RbacAuthorizationService`: deny by default, scope coverage (tenant > organization > unit), explicit permission catalog per architectural role (`permissions.ts`, no wildcards), no privilege escalation on role assignment, break-glass platform operators limited to tenant provisioning.
- Roles are owned: `tenantId` absent = platform catalog role; a tenant's role is invisible (NotFound) to other tenants and cannot be granted platform-wide.
- Entitlements (`entitlements.ts`): plan limits, monthly quotas and feature flags are configuration, not code; per-tenant overrides; fail closed when a tenant has no plan; limit checks run inside the unit of work (race-free). `UsageService` meters consumption per tenant/month (the base for per-client cost monitoring). Plan numbers are owner decisions and live in an `EntitlementSource`, not in the code.
- Tests: 49 passing; every new guard was mutation-checked. The `scope.level === "platform"` clause in `assignRole` is defense in depth (the context check catches it first).
- Still in-memory: the plan source, usage meter and queue/cache ports arrive with Etapa 4.

## Postgres persistence (Etapa 4)
- Schema `heal` on the Supabase project `Tysvora` (sa-east-1), migrations 0001-0005 applied; all 17 tables have forced RLS; security advisor clean. Details: `docs/core/POSTGRES.md`.
- Adapter (`src/core/infrastructure/postgres/`): tenant-scoped repositories, transactional unit of work with per-tenant advisory lock, audit sink, outbox publisher, entitlement source and usage meter. `UnitOfWork.run` now receives the tenant.
- 11 tests run against a real Postgres (end-to-end flow, atomic rollback, race-free limits/quotas/de-duplication, RLS attacks). Mutation-checked: opening a read/insert policy, removing the lock, granting delete on audit, opening platform writes each fail the suite.
- Still open: login role + pooler for the API, OIDC/MFA identity provider, outbox relay, queue/cache ports, LGPD retention/encryption policy.

## Sentinela triggers (Etapa 5, first slice)
- A recorded fact re-evaluates its enrollment (best effort: the fact is already committed, so an evaluation problem never makes the caller retry and duplicate it; the recorder needs no `sentinela.evaluate` permission and no denied-audit noise is produced).
- `sweepContinuity` (daily, under a technical-operator identity): re-evaluates active enrollments of the acting organization because time itself is a signal (an exam turns overdue with no new fact). Idempotent, bounded per run (default 500, max 5000), one failing enrollment never stops the rest, gated by permission and plan feature.
- Known limitation: an open pendency keeps the evidence it had when it opened (dedup); later signals are visible in a fresh evaluation but are not appended to the pendency history yet.
- Next: see "Consent, contacts and demand intake" below.

## Consent, contacts and demand intake (Etapa 5, slice 2)
- `ConsentRecord` (purpose + channel + legal basis + evidence; immutable history, one granted per person/channel/purpose enforced by a unique index; revocation is immediate; `canContact` is the outbound gate). Legal basis is recorded as given: which basis applies is a decision for the institution and counsel.
- `ContactBinding`: verified link person <-> address; Brazilian mobiles match with or without the ninth digit. Unverified or shared numbers never route a message to a record.
- Inbound (`IntakeApplication.receiveWebhook/receive`): HMAC-SHA256 over the raw body (constant time, strict header, empty secret never validates) -> connection resolved by the institution's own account -> stored once (unique per tenant/channel/provider id; 12 simultaneous redeliveries store one demand and one fact) -> linked only when exactly one verified binding matches, otherwise kept for human triage. Inbound is metered but never refused by a quota. Text is cleaned and bounded and stored as data.
- Demand facts (`demand.opened`/`demand.answered`) feed Sentinela's unanswered-demand rule; answering clears it. Both writes are idempotent and a retry completes a half-finished attempt.
- The integration identity is a tenant-scoped `integration-service` role (only `demand.receive`), provisioned by the platform; the connection's service user must belong to the connection's tenant (checked in code and by a composite foreign key).
- `WhatsAppCloudProvider` is written from Meta's documented payload and NOT validated against live traffic (needs an approved app / Tech Provider). Policy note: WhatsApp's business policy restricts health information, so the channel is designed for contact and notices, with clinical content kept inside the platform.
- Not built: outbound sending, templates, the secret store behind `secretRef`, verification of account ownership during Embedded Signup, retention/encryption of message text (LGPD), the outbox relay.
- Migrations 0006-0007 live on the Tysvora project; 85 tests (15 against Postgres); mutation-checked in code and in the database.

## Open decisions (need the owner)

1. Roles have no tenant owner (global registry). A tenant can reference a role created elsewhere if it knows the id. Needs `Role.tenantId` or a platform-curated catalog.
2. Persistence, identity provider and authorization policy are still in-memory ports (ADR-003/004/005/006/013/015/016 remain open).
3. Continuity pendencies are created on evaluation; the scheduler that triggers evaluation is not built yet.
