import { ArchitecturalRole } from "./access.js";

/** Every action the application layer authorizes. Anything not listed here is denied by the RBAC policy. */
export const ALL_ACTIONS = [
  "tenant.create", "tenant.read", "organization.create", "unit.create", "user.create", "professional.create", "subject.create",
  "role.create", "role.assign", "role.assign.platform",
  "program.create", "program.approve", "program.enroll", "fact.record", "sentinela.evaluate",
  "pendency.list", "pendency.assign", "pendency.accept", "pendency.transfer", "pendency.pause", "pendency.resume",
  "pendency.escalate", "pendency.resolve", "pendency.close", "pendency.reopen"
] as const;
export type Action = typeof ALL_ACTIONS[number];

const PENDENCY_WORK: readonly Action[] = ["pendency.list", "pendency.assign", "pendency.accept", "pendency.transfer", "pendency.pause", "pendency.resume", "pendency.escalate", "pendency.resolve", "pendency.close", "pendency.reopen"];
const CARE: readonly Action[] = ["program.enroll", "fact.record", "sentinela.evaluate", ...PENDENCY_WORK];

/** Default permissions per architectural role. Deliberately explicit: no wildcards, deny by default. */
export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<ArchitecturalRole, readonly Action[]>> = {
  "platform-admin": ALL_ACTIONS,
  "tenant-admin": ["tenant.read", "organization.create", "unit.create", "user.create", "professional.create", "subject.create", "role.create", "role.assign", "program.create", "program.approve", ...CARE],
  "municipal-management": ["unit.create", "user.create", "professional.create", "subject.create", "role.assign", "program.create", "program.approve", ...CARE],
  "unit-management": ["professional.create", "subject.create", "role.assign", ...CARE],
  "professional": ["subject.create", ...CARE],
  "technical-operator": ["sentinela.evaluate", "pendency.list"],
  "patient-user": []
};
