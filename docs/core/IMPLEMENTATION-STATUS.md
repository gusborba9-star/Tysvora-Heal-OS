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

## Open decisions (need the owner)

1. Roles have no tenant owner (global registry). A tenant can reference a role created elsewhere if it knows the id. Needs `Role.tenantId` or a platform-curated catalog.
2. Persistence, identity provider and authorization policy are still in-memory ports (ADR-003/004/005/006/013/015/016 remain open).
3. Continuity pendencies are created on evaluation; the scheduler that triggers evaluation is not built yet.
