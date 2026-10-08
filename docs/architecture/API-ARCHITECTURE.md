# Tysvora Heal OS — API Architecture

## 1. Boundary

APIs expose application/domain capabilities. They are not direct table CRUD contracts.

Initial convention:

```
/api/v1/...
```

Examples are conceptual only:

```
/api/v1/patients
/api/v1/appointments
/api/v1/modules
/api/v1/pharmacy
```

## 2. API Gateway

A gateway/boundary layer should centralize cross-cutting concerns such as authentication context, authorization enforcement, rate limiting, correlation IDs, observability and request policy.

The exact gateway implementation is **DECISION PENDING**.

## 3. Versioning

Publicly consumed contracts are versioned. Breaking changes require a new contract/version and migration/deprecation strategy.

## 4. Authentication and authorization

Authentication establishes identity; authorization evaluates tenant, role, permission and contextual policy. APIs must never infer authorization from route naming alone.

## 5. Idempotency

Mutating operations that may be retried must support idempotency semantics where duplicate execution would be harmful.

## 6. Pagination, filtering and sorting

Collection endpoints should use bounded pagination. Filtering and sorting must use an allowlisted contract, not arbitrary database expressions.

## 7. Validation

Validate input at the API boundary and again at domain invariants where necessary. Never trust client-side validation.

## 8. Errors

Use stable machine-readable error codes with safe human-readable messages. Do not expose stack traces, SQL details, secrets or sensitive internal state.

## 9. Rate limits

Rate limits should be defined by risk and resource type, with stricter policies for authentication, AI and expensive operations.

## 10. Observability

Requests should carry correlation IDs. Logs and metrics must capture latency, outcome and resource identifiers without exposing unnecessary sensitive data.

## 11. Auditability

Business/clinical mutations requiring audit must emit auditable records independently of ordinary technical logs.

## 12. Domain orientation

API boundaries should follow domain capabilities rather than database tables. Modules own module endpoints while shared capabilities remain Core APIs.

No endpoint is implemented in this execution.
