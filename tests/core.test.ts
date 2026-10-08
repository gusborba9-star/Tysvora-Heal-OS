import { createTenant,createOrganization,createUnit,createIdentity,createUser,createProfessional,createSubject,createRole,createPermission,createRolePermission,createUserRole,createRequestContext,createAuditEntry,createDomainEvent,InMemoryEventPublisher,DomainInvariantError } from "../src/index.js";
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(`Assertion failed: ${message}`);}
function eq<T>(actual:T,expected:T,message:string):void{if(actual!==expected)throw new Error(`Assertion failed: ${message}. Expected ${String(expected)}, got ${String(actual)}`);}
function rejects(test:()=>unknown,message:string):void{try{test();throw new Error(`Expected rejection: ${message}`);}catch(error){if(!(error instanceof DomainInvariantError))throw error;}}
function run(name:string,test:()=>Promise<void>|void):Promise<void>{return Promise.resolve().then(test).then(()=>console.log(`PASS ${name}`));}

const tenantA=createTenant({id:"tenant-a",name:"Tenant A"});
const tenantB=createTenant({id:"tenant-b",name:"Tenant B"});
const orgA=createOrganization({id:"org-a",tenantId:"tenant-a",name:"Org A"},tenantA);
const orgB=createOrganization({id:"org-b",tenantId:"tenant-b",name:"Org B"},tenantB);
const userA=createUser({id:"user-a",tenantId:"tenant-a",identityId:"identity-a",displayName:"User A"},tenantA);
const unitA=createUnit({id:"unit-a",tenantId:"tenant-a",organizationId:"org-a",name:"Unit A"},orgA);
const unitB=createUnit({id:"unit-b",tenantId:"tenant-b",organizationId:"org-b",name:"Unit B"},orgB);

await run("creates a valid tenant",()=>eq(tenantA.id,"tenant-a","tenant id"));
await run("relates organization to tenant",()=>eq(orgA.tenantId,tenantA.id,"organization tenant"));
await run("rejects organization from another tenant",()=>rejects(()=>createOrganization({id:"org-cross",tenantId:"tenant-b",name:"Cross"},tenantA),"organization tenant mismatch"));
await run("relates unit to organization and tenant",()=>{eq(unitA.organizationId,orgA.id,"unit organization");eq(unitA.tenantId,tenantA.id,"unit tenant");});
await run("rejects unit with incompatible tenant",()=>rejects(()=>createUnit({id:"unit-cross",tenantId:"tenant-b",organizationId:"org-a",name:"Cross"},orgA),"unit tenant mismatch"));
await run("creates explicit tenancy context",()=>{const c=createRequestContext({tenantId:"tenant-a",organizationId:"org-a",unitId:"unit-a",actorUserId:"user-a",correlationId:"corr-1"});eq(c.tenantId,"tenant-a","context tenant");eq(c.correlationId,"corr-1","context correlation");});
await run("keeps identity separate from user",()=>{const i=createIdentity({id:"identity-a",subject:"external-subject-a"});const u=createUser({id:"user-a",tenantId:"tenant-a",identityId:i.id,displayName:"User A"},tenantA);eq(u.identityId,i.id,"identity association");assert(u.id!==i.id,"identity and user are distinct");});
await run("rejects user from incompatible tenant",()=>rejects(()=>createUser({id:"user-cross",tenantId:"tenant-b",identityId:"identity-b",displayName:"Cross"},tenantA),"user tenant mismatch"));
await run("associates professional coherently",()=>eq(createProfessional({id:"professional-a",tenantId:"tenant-a",userId:"user-a",organizationId:"org-a"},userA,orgA).organizationId,orgA.id,"professional organization"));
await run("rejects professional with incompatible organization",()=>rejects(()=>createProfessional({id:"professional-cross",tenantId:"tenant-a",userId:"user-a",organizationId:"org-b"},userA,orgB),"professional tenant mismatch"));
await run("associates subject coherently",()=>eq(createSubject({id:"subject-a",tenantId:"tenant-a",organizationId:"org-a",displayName:"Subject A"},orgA).tenantId,tenantA.id,"subject tenant"));
await run("rejects subject with incompatible organization",()=>rejects(()=>createSubject({id:"subject-cross",tenantId:"tenant-a",organizationId:"org-b",displayName:"Cross"},orgB),"subject tenant mismatch"));
await run("supports role and permission relationships",()=>{const r=createRole({id:"role-professional",name:"Professional",architecturalRole:"professional"});const p=createPermission({id:"permission-read-subject",code:"subject.read"});eq(createRolePermission({roleId:r.id,permissionId:p.id}).roleId,r.id,"role permission");eq(createUserRole({userId:"user-a",roleId:r.id,scope:{level:"tenant",tenantId:"tenant-a"}},userA).scope.level,"tenant","user role scope");});
await run("rejects user role from another tenant",()=>rejects(()=>createUserRole({userId:"user-a",roleId:"role-professional",scope:{level:"tenant",tenantId:"tenant-b"}},userA),"user role tenant mismatch"));
await run("accepts platform role without tenant",()=>eq(createUserRole({userId:"user-a",roleId:"role-platform",scope:{level:"platform"}},userA).scope.level,"platform","platform role"));
await run("rejects organization role with incompatible tenant",()=>rejects(()=>createUserRole({userId:"user-a",roleId:"role-management",scope:{level:"organization",tenantId:"tenant-b",organizationId:"org-b"}},userA,orgB),"organization role tenant mismatch"));
await run("rejects unit role with incompatible organization",()=>rejects(()=>createUserRole({userId:"user-a",roleId:"role-management",scope:{level:"unit",tenantId:"tenant-a",organizationId:"org-a",unitId:"unit-b"}},userA,orgA,unitB),"unit role organization mismatch"));
await run("creates audit entry",()=>eq(createAuditEntry({id:"audit-1",tenantId:"tenant-a",actorId:"user-a",action:"user.created",resource:"user",resourceId:"user-a",timestamp:"2026-10-08T00:00:00.000Z",correlationId:"corr-1",result:"success"}).correlationId,"corr-1","audit correlation"));
await run("creates and publishes versioned domain event",async()=>{const e=createDomainEvent({eventId:"event-1",eventType:"user.created",version:1,occurredAt:"2026-10-08T00:00:00.000Z",tenantId:"tenant-a",actorId:"user-a",source:"heal-core",correlationId:"corr-1",payload:{userId:"user-a"}});const p=new InMemoryEventPublisher();await p.publish(e);eq(p.snapshot().length,1,"event count");eq(p.snapshot()[0]?.correlationId,"corr-1","event correlation");});
await run("propagates correlation id",()=>{const id="corr-2";const c=createRequestContext({tenantId:"tenant-a",actorUserId:"user-a",correlationId:id});const a=createAuditEntry({id:"audit-2",tenantId:c.tenantId,actorId:c.actorUserId,action:"test",resource:"test",timestamp:"2026-10-08T00:00:00.000Z",correlationId:id,result:"success"});const e=createDomainEvent({eventId:"event-2",eventType:"test.completed",version:1,occurredAt:"2026-10-08T00:00:00.000Z",tenantId:c.tenantId,actorId:c.actorUserId,source:"heal-core",correlationId:id,payload:{}});eq(c.correlationId,a.correlationId,"context/audit");eq(a.correlationId,e.correlationId,"audit/event");});
await run("keeps tenant contexts distinct",()=>{const a=createRequestContext({tenantId:"tenant-a",actorUserId:"user-a"});const b=createRequestContext({tenantId:"tenant-b",actorUserId:"user-b"});assert(a.tenantId!==b.tenantId,"tenant contexts must remain distinct");});
