# Tysvora Heal OS — Deployment Architecture

## 1. Environments

- Development
- Test
- Preview
- Staging/Homologation
- Production

Environment separation must prevent accidental cross-environment data and credential use.

## 2. Configuration

Configuration is environment- and scope-aware. Tenant/module settings must not be compiled into customer-specific application forks.

## 3. Secrets

Secrets must come from dedicated secret management/environment mechanisms and never be committed or packaged as deployment artifacts.

## 4. Migrations

Database migrations are versioned with releases and must have forward/rollback or recovery procedures appropriate to the migration type.

## 5. Release

A release is an immutable/versioned application artifact with identifiable source revision and configuration requirements.

## 6. Rollback

Rollback must account for application compatibility and database migration state. Destructive schema changes require expand/contract or an equivalent safe migration strategy.

## 7. Health

Deployments require health checks and observable startup/runtime status before promotion.

## 8. Backup and disaster recovery

Production requires backups, restore testing, defined RPO/RTO and disaster-recovery procedures.

**DECISION PENDING:** exact RPO/RTO targets, backup topology and definitive municipal deployment topology.

## 9. Same application, different configuration

```
Tysvora Release
       ↓
Tenant Configuration
       ↓
Module Activation
       ↓
Integration Configuration
       ↓
Deployment
```

The preferred model is one application/version with tenant-specific configuration and enabled capabilities, not customer-specific forks.

## 10. Municipal deployment

The architecture must support centrally governed releases while permitting tenant-specific integration/configuration. Whether a municipality requires a dedicated runtime, isolated infrastructure or shared infrastructure remains a workload/compliance decision.

## 11. Vercel

Vercel is the initial preferred web deployment platform for Next.js, subject to later validation of workload, data-boundary and operational requirements. Provider-specific capabilities must not become domain dependencies.

## 12. Platform portability

Application/domain contracts should avoid direct dependence on provider APIs except behind infrastructure adapters. This preserves migration options to other compute/deployment platforms.
