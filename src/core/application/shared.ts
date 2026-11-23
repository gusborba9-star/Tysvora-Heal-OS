import { EntityId } from "../../shared/ids.js";

export type ApplicationContext =
  | { readonly scope: "platform"; readonly actorUserId?: EntityId; readonly correlationId?: string }
  | { readonly scope: "tenant"; readonly tenantId: EntityId; readonly organizationId?: EntityId; readonly unitId?: EntityId; readonly actorUserId?: EntityId; readonly correlationId?: string };

export interface AuthorizationRequest {
  readonly actorUserId?: EntityId;
  readonly action: string;
  readonly resource: string;
  readonly resourceId?: EntityId;
  readonly context: ApplicationContext;
  /** Target details the policy needs to decide (e.g. which role and scope are being assigned). */
  readonly attributes?: Readonly<Record<string, unknown>>;
}
export interface AuthorizationService { can(request: AuthorizationRequest): Promise<boolean>; }

export class ApplicationError extends Error { constructor(message: string) { super(message); this.name = "ApplicationError"; } }
export class AuthorizationError extends ApplicationError { constructor(message = "operation not authorized") { super(message); this.name = "AuthorizationError"; } }
export class NotFoundError extends ApplicationError { constructor(resource: string, id: string) { super(resource + " not found: " + id); this.name = "NotFoundError"; } }

export function platformContext(input: { actorUserId?: EntityId; correlationId?: string } = {}): ApplicationContext {
  return { scope: "platform", actorUserId: input.actorUserId, correlationId: input.correlationId };
}
export function tenantContext(input: Omit<Extract<ApplicationContext, {scope:"tenant"}>, "scope">): ApplicationContext {
  return { scope: "tenant", ...input };
}

