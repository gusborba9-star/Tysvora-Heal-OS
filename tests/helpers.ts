import { InMemoryUnitOfWork, Snapshottable, IdentityProvider } from "../src/index.js";

/** Test identity provider that recognizes every identity (legacy suites). Strict suites register identities explicitly. */
export const acceptAllIdentities: IdentityProvider = {
  async resolve(identityId: string) { return { id: identityId, subject: "subject-" + identityId }; }
};
export function unitOfWorkFor(...participants: Snapshottable[]): InMemoryUnitOfWork {
  return new InMemoryUnitOfWork(participants);
}
