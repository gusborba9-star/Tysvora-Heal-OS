import {
  ConfigurationApplication, AuthorizationService, AuthorizationRequest, ApplicationError, AuthorizationError, DomainInvariantError, NotFoundError,
  InMemoryConfigurationRepository, InMemoryRepository, InMemoryAuditSink, InMemoryEventPublisher, SequenceIdGenerator, FixedClock,
  createTenant, createOrganization, createUnit
} from "../src/index.js";
function assert(value:unknown,message:string):asserts value { if(!value) throw new Error("Assertion failed: "+message); }
async function rejects(factory:()=>Promise<unknown>,ErrorType:Function,message:string):Promise<void> { try { await factory(); throw new Error("Expected rejection: "+message); } catch(error) { if(!(error instanceof ErrorType)) throw error; } }
class Policy implements AuthorizationService {
  readonly requests:AuthorizationRequest[]=[];
  constructor(private readonly denied:Set<string>=new Set()) {}
  async can(request:AuthorizationRequest):Promise<boolean> { this.requests.push(request); return !this.denied.has(request.action); }
}
const organizations=new InMemoryRepository<any>(),units=new InMemoryRepository<any>();
const tenantA=createTenant({id:"tenant-a",name:"Tenant A"}),tenantB=createTenant({id:"tenant-b",name:"Tenant B"});
const orgA=createOrganization({id:"org-a",tenantId:tenantA.id,name:"Org A"},tenantA),orgB=createOrganization({id:"org-b",tenantId:tenantB.id,name:"Org B"},tenantB);
const unitA=createUnit({id:"unit-a",tenantId:tenantA.id,organizationId:orgA.id,name:"Unit A"},orgA),unitB=createUnit({id:"unit-b",tenantId:tenantB.id,organizationId:orgB.id,name:"Unit B"},orgB);
await organizations.save(orgA); await organizations.save(orgB); await units.save(unitA); await units.save(unitB);
const configs=new InMemoryConfigurationRepository(),audit=new InMemoryAuditSink(),events=new InMemoryEventPublisher(),policy=new Policy();
const app=new ConfigurationApplication({ids:new SequenceIdGenerator("config"),clock:new FixedClock("2026-10-08T00:00:00.000Z"),authorization:policy,audit,events,configurations:configs,organizations,units});
const tenantCtx={scope:"tenant" as const,tenantId:tenantA.id,actorUserId:"admin-a",correlationId:"corr-config"};
const tenantBContext={scope:"tenant" as const,tenantId:tenantB.id,actorUserId:"admin-b"};
const orgCtx={scope:"tenant" as const,tenantId:tenantA.id,organizationId:orgA.id,actorUserId:"org-admin"};
const unitCtx={scope:"tenant" as const,tenantId:tenantA.id,organizationId:orgA.id,unitId:unitA.id,actorUserId:"unit-admin"};
const tenantScope={level:"tenant" as const,tenantId:tenantA.id},orgScope={level:"organization" as const,tenantId:tenantA.id,organizationId:orgA.id};
const unitScope={level:"unit" as const,tenantId:tenantA.id,organizationId:orgA.id,unitId:unitA.id},moduleScope={level:"module" as const,tenantId:tenantA.id,moduleId:"module-alpha"};
const created=await app.create(tenantCtx,{key:"feature.flag",value:{enabled:true,threshold:3},scope:tenantScope});
assert(created.id.length>0,"stable identity assigned");
assert((await app.getById(tenantCtx,{id:created.id,scope:tenantScope})).key==="feature.flag","read by identity");
assert((await app.getByKey(tenantCtx,{key:"feature.flag",scope:tenantScope})).id===created.id,"read by key in exact scope");
const updated=await app.update(tenantCtx,{id:created.id,scope:tenantScope,value:{enabled:false,threshold:5}});
assert((updated.value as {enabled:boolean}).enabled===false,"update changes value");
assert(updated.id===created.id && updated.scope.level==="tenant" && updated.key==="feature.flag","update preserves identity, key and scope");
await rejects(()=>app.create(tenantCtx,{key:"feature.flag",value:true,scope:tenantScope}),ApplicationError,"duplicate key rejected");
assert((await app.getByKey(tenantCtx,{key:"feature.flag",scope:tenantScope})).id===created.id,"duplicate did not replace configuration");
const orgConfig=await app.create(tenantCtx,{key:"feature.flag",value:"organization-value",scope:orgScope});
const unitConfig=await app.create(tenantCtx,{key:"feature.flag",value:"unit-value",scope:unitScope});
const moduleConfig=await app.create(tenantCtx,{key:"feature.flag",value:"module-value",scope:moduleScope});
assert(orgConfig.id!==unitConfig.id && unitConfig.id!==moduleConfig.id,"same key has distinct identity across scopes");
assert((await app.getByKey(orgCtx,{key:"feature.flag",scope:orgScope})).id===orgConfig.id,"organization scope read");
assert((await app.getByKey(unitCtx,{key:"feature.flag",scope:unitScope})).id===unitConfig.id,"unit scope read");
assert((await app.getByKey(tenantCtx,{key:"feature.flag",scope:moduleScope})).id===moduleConfig.id,"module scope read");
await rejects(()=>app.getById(tenantBContext,{id:created.id,scope:tenantScope}),DomainInvariantError,"cross-tenant scope rejected");
await rejects(()=>app.getById(tenantCtx,{id:orgConfig.id,scope:tenantScope}),NotFoundError,"identity cannot bypass stored scope");
await rejects(()=>app.getByKey(orgCtx,{key:"feature.flag",scope:tenantScope}),DomainInvariantError,"organization context cannot widen to tenant scope");
await rejects(()=>app.getByKey(unitCtx,{key:"feature.flag",scope:orgScope}),DomainInvariantError,"unit context cannot widen to organization scope");
await rejects(()=>app.create(tenantCtx,{key:"cross-org",value:true,scope:{level:"organization",tenantId:tenantA.id,organizationId:orgB.id}}),DomainInvariantError,"organization cannot cross tenant");
await rejects(()=>app.create(tenantCtx,{key:"cross-unit",value:true,scope:{level:"unit",tenantId:tenantA.id,organizationId:orgA.id,unitId:unitB.id}}),DomainInvariantError,"unit cannot cross organization and tenant");
const beforeCount=configs.snapshot().length,beforeAudit=audit.snapshot().length,beforeEvents=events.snapshot().length;
const platformScope={level:"platform" as const};
await rejects(()=>app.create(tenantCtx,{key:"global",value:true,scope:platformScope}),ApplicationError,"platform create rejected");
await rejects(()=>app.getByKey(tenantCtx,{key:"global",scope:platformScope}),ApplicationError,"platform key read rejected");
await rejects(()=>app.getById(tenantCtx,{id:"missing",scope:platformScope}),ApplicationError,"platform identity read rejected");
await rejects(()=>app.update(tenantCtx,{id:created.id,scope:platformScope,value:true}),ApplicationError,"platform update rejected");
assert(configs.snapshot().length===beforeCount && audit.snapshot().length===beforeAudit && events.snapshot().length===beforeEvents,"platform rejection has no persistence or success side effects");
const deniedPolicy=new Policy(new Set(["configuration.create","configuration.read","configuration.update"]));
const deniedAudit=new InMemoryAuditSink(),deniedEvents=new InMemoryEventPublisher(),deniedConfigs=new InMemoryConfigurationRepository();
const deniedApp=new ConfigurationApplication({ids:new SequenceIdGenerator("denied"),clock:new FixedClock("2026-10-08T00:00:00.000Z"),authorization:deniedPolicy,audit:deniedAudit,events:deniedEvents,configurations:deniedConfigs,organizations,units});
await rejects(()=>deniedApp.create(tenantCtx,{key:"denied",value:true,scope:tenantScope}),AuthorizationError,"denied create");
await rejects(()=>deniedApp.getById(tenantCtx,{id:created.id,scope:tenantScope}),AuthorizationError,"denied read");
await rejects(()=>deniedApp.update(tenantCtx,{id:created.id,scope:tenantScope,value:false}),AuthorizationError,"denied update");
assert(deniedConfigs.snapshot().length===0 && deniedAudit.snapshot().length===0 && deniedEvents.snapshot().length===0,"denied operations have no persistence or success side effects");
const auditBefore=audit.snapshot().length,eventBefore=events.snapshot().length;
await rejects(()=>app.getById(tenantCtx,{id:"missing-config",scope:tenantScope}),NotFoundError,"missing identity");
await rejects(()=>app.create(tenantCtx,{key:"invalid-json",value:undefined as never,scope:tenantScope}),Error,"non-JSON value rejected");
assert(audit.snapshot().length===auditBefore && events.snapshot().length===eventBefore,"failed reads do not audit or publish success");
assert(audit.snapshot().length===5 && events.snapshot().length===5,"each successful create/update emits audit and event");
assert(policy.requests.every(request=>request.resource.startsWith("configuration:")),"authorization receives explicit scope resource");
console.log("PASS configuration application, scope isolation, authorization, platform rejection and side-effect invariants");
