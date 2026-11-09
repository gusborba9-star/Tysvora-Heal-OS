# Tysvora Heal OS — Data Architecture

## 1. Plataforma e organização

PostgreSQL é a base transacional preferencial; Supabase é a plataforma gerenciada inicialmente documentada, sem eliminar portabilidade. Organização por bounded context/schemas com ownership explícito. Não criar tabela antes de contrato, autorização, retenção e migração definidos.

## 2. Classes de dados

Core/identidade; organizacional; assistencial/clinical; programa/jornada; operacional; documentos; integração/proveniência; auditoria; analítico; telemetria. Dados sensíveis não são replicados para analytics sem finalidade, minimização e política de acesso.

## 3. Tenancy e isolamento

Tenant context em todo dado tenant-owned. Organization, Unit, Team, CareRelationship e ProgramEnrollment são dimensões adicionais de escopo, não substitutos de tenant. RLS é defesa obrigatória quando PostgreSQL/Supabase. Testes negativos devem cobrir acesso cruzado.

## 4. Proveniência e lineage

Dados integrados preservam source system, external identifier, source timestamp, ingestion timestamp, actor/source identity, extraction method, mapping/transform version, validation status, confidence/quality, sync cursor and conflict state. Ver especificação DATA-PROVENANCE.

## 5. Reconciliação

Não assumir que última escrita vence. Definir autoridade por atributo e domínio, frescor, confiabilidade, autoria e regra institucional. Conflitos geram estado explícito e fila de reconciliação; nenhuma sobrescrita silenciosa de informação clínica.

## 6. Versionamento e temporalidade

Distinguir tempo do evento, tempo de registro, tempo de ingestão e vigência. Preservar versões de programas, protocolos, planos e documentos. Correções são novos registros/eventos com referência ao anterior.

## 7. Persistência, migrações e retenção

Migrations versionadas, reproduzíveis, revisáveis e reversíveis quando possível. Retenção, descarte, anonimização e bloqueio legal por classe e jurisdição. Documentos binários em object storage protegido; metadados e ACL no banco.

## 8. Backup, recuperação e analytics

Backups e restore tests obrigatórios; RPO/RTO por ADR. Analytics desacoplado do workload transacional quando volume justificar. Métricas com definição, lineage, qualidade e janela temporal explícitas.

## 9. Decisões pendentes

Object storage, particionamento, warehouse, search, estratégia de CDC, retenção detalhada e RPO/RTO.
