# Tysvora Heal OS — Security Architecture

## 1. Security model

Security is defense in depth across identity, authorization, tenancy, data, application, infrastructure and observability.

## 2. Roles

- **Platform Admin:** Tysvora-level platform governance; not automatically entitled to tenant clinical content.
- **Tenant Admin:** administrative control within its tenant.
- **Municipal Management:** management capabilities explicitly granted within applicable public-health tenant scope.
- **Unit Management:** unit-level management permissions.
- **Professional:** professional capabilities explicitly granted by role/context.
- **Patient/User:** subject-facing capabilities explicitly granted.
- **Technical Operator:** operational/infrastructure capabilities; technical access does not imply clinical-content access.

"Admin" is never a universal permission.

## 3. Authentication

Authentication is a dedicated security boundary. The implementation must support secure identity lifecycle, session management, MFA where required, credential recovery and revocation according to risk.

The definitive identity provider is **DECISION PENDING** for implementation planning.

## 4. Authorization

Authorization combines tenant context, RBAC, permissions and contextual rules. Least privilege is mandatory.

Roles grant permissions; they do not bypass tenant boundaries.

## 5. Tenant isolation

Tenant context must be established, propagated and validated on protected operations. Database-level RLS is a required defense-in-depth control with PostgreSQL/Supabase.

Application checks alone are insufficient for high-value tenant isolation.

## 6. Audit

Security-relevant and governed business/clinical actions require auditable records with actor, tenant, action, target, timestamp and correlation context as appropriate.

Audit data must be protected against unauthorized alteration.

## 7. Secrets

Secrets must be stored in dedicated secret-management mechanisms. They must never be committed to Git or included in deployment packages.

## 8. Encryption

Encryption in transit and at rest is required according to platform capabilities and applicable risk. Key-management details remain an implementation decision.

## 9. API security

Protected APIs require authentication/authorization, validation, rate limiting where appropriate, abuse controls, correlation IDs and secure error handling.

## 10. Session security

Sessions require expiration/revocation controls, secure cookie/token handling where applicable, CSRF protections appropriate to the interaction model and detection of anomalous access.

## 11. Input and output

Validate untrusted input at boundaries. Avoid leaking sensitive data through errors, logs or observability payloads.

## 12. Threat modeling and testing

Security threat modeling is required for high-risk capabilities. Security testing should include dependency review, authorization tests, tenant-isolation tests, API abuse tests and appropriate dynamic/static analysis.

## 13. LGPD principles

The architecture should apply purpose limitation, necessity/data minimization, security, transparency and controlled access consistent with LGPD obligations. Legal interpretation remains outside this technical document.

## 14. Technical access boundary

Infrastructure operators may operate systems without being granted clinical-content access by default. Operational break-glass access, when required, must be explicit, time-bounded, justified and audited.

**DECISION PENDING:** definitive authentication provider and MFA strategy.
