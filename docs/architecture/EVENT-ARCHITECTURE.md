# Tysvora Heal OS — Event Architecture

## 1. Purpose

Events provide a decoupled mechanism for important system facts, module reactions, observability and integrations.

Examples:

- `patient.created`
- `appointment.created`
- `appointment.missed`
- `module.activated`
- `inventory.low`
- `inventory.expiring`
- `referral.stalled`
- `notification.sent`
- `ai.requested`
- `ai.completed`

These are conceptual event names.

## 2. Event envelope

Each governed event should contain:

- event name;
- event ID;
- tenant ID when tenant-scoped;
- timestamp;
- actor/context where applicable;
- source;
- version;
- payload;
- correlation ID.

## 3. Event categories

**Domain event:** a meaningful fact inside the domain.

**Integration event:** a contract intended for external consumers/adapters.

**Technical log:** operational diagnostic information; not a domain fact and not a substitute for audit.

## 4. Guarantees

Consumers must assume at-least-once delivery unless a later implementation explicitly establishes stronger semantics. Therefore handlers must be idempotent.

Events are immutable facts; corrections are represented through subsequent events rather than mutating historical event meaning.

## 5. Versioning

Event contracts require explicit versions. Breaking payload changes require a new version or migration strategy.

## 6. Broker

A specific broker is **DECISION PENDING**. Selection must consider workload, ordering, retry semantics, durability, cost and operational burden.

## 7. Transactional publication

The implementation should use a reliable transaction-to-event strategy for critical domain events; exact mechanism is **DECISION PENDING** and must be resolved before production event processing.
