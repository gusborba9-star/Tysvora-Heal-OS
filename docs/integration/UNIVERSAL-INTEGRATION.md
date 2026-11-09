# Universal Integration Platform (UIP)

## 1. Objetivo

Conectar Tysvora a qualquer sistema com uma porta de dados acessível, de forma segura, governada, rastreável e substituível. “Universal” expressa arquitetura extensível, não promessa de compatibilidade automática com todo fornecedor.

## 2. Modalidades

- API: REST/GraphQL conforme contrato, OAuth2/OIDC, API keys quando justificadas, webhooks assinados.
- Database: PostgreSQL, MySQL, SQL Server e outros via drivers aprovados; credencial dedicada, least privilege, read-only preferencial, limites de consulta.
- Files: CSV, XLSX, XML, JSON, OFX e documentos com validação, quarentena e import preview.
- Local Connector Agent: acesso a redes locais, diretórios e sistemas legados; identidade de máquina, comunicação outbound, atualização assinada, logs e escopo mínimo.
- Standards: HL7 FHIR R4, RNDS e padrões pertinentes após mapeamento, credenciais, contrato e homologação.

## 3. Connector contract

Manifesto: connector_id/version, vendor/system, supported capabilities, auth mode, scopes, data domains, schema/mapping versions, rate limits, sync mode, health, retry, idempotency, retention, data classification and support lifecycle.

## 4. Pipeline

Discover → authenticate → extract → validate → quarantine invalid → normalize → map → resolve identity → reconcile → persist → emit event → monitor. Cada etapa tem estado e possibilidade de reprocessamento idempotente.

## 5. Sync

Suportar batch, incremental, webhook e polling conforme fonte. Checkpoint/cursor, watermark, deduplication, retry with backoff, dead-letter, replay e reconciliação. Não assumir ordenação nem entrega exactly-once.

## 6. Identidade e matching

Matching determinístico primeiro, probabilístico somente com governança e revisão quando risco alto. Nunca unir pacientes automaticamente apenas por nome. Registrar confiança, evidência e decisão de vinculação.

## 7. Segurança

Segredos por conexão, rotação, escopo mínimo, TLS, assinatura, allowlist, isolamento tenant, limites de rede, auditoria e proteção contra payload malicioso. Agente local não deve expor rede interna ao Tysvora.

## 8. Operação

Health, lag, throughput, falhas, taxa de reconciliação, drift de schema, custo e alertas. Desconexão não deve corromper dados; sincronização recupera a partir de checkpoint.

## 9. Interoperabilidade

FHIR/RNDS não resolvem automaticamente semântica, identidade, autorização ou qualidade. Mapear perfis/recursos, terminologias, extensões e obrigações de homologação por caso de uso.

 
## 10. Easy Connect e Universal Data Intake

Easy Connect é a experiência self-service institucional da UIP. Fluxo: selecionar fonte → identificar fornecedor/categoria → recomendar modalidade → autenticar ou parear agente → descobrir capacidades → selecionar recursos e escopos → sugerir mappings → pré-visualizar dados → validar/quarentenar → aprovar → ativar → monitorar. O usuário pode interromper e retomar; erros devem explicar causa e ação corretiva. Fluxos comuns não exigem conhecimento de endpoint, SQL ou schema; configuração avançada fica disponível apenas a usuários autorizados.

Universal Data Intake inclui:
- cadastro manual com autoria, instituição, timestamp e validação;
- upload pontual e recorrente de CSV, XLSX, XML, JSON, OFX, PDF, imagens e documentos;
- importação de CRM, ERP, sistemas administrativos e plataformas de atendimento;
- import preview, validação de tipo/tamanho/schema/malware, quarantine, mapping assistido, detecção de duplicidade, aprovação e relatório de aceitos/rejeitados;
- OCR/extração como sugestão sujeita à revisão apropriada;
- preservação de fonte, lineage, finalidade e classificação.

## 11. Tysvora Connector Agent

Runtime local opcional, separado do produto web, baixado pelo painel e instalado em máquina/servidor autorizado. O navegador permite download, pareamento, configuração e observação; não pode acessar arbitrariamente arquivos, bancos ou redes privadas. O agente executa a conectividade local.

Requisitos: pareamento temporário e de escopo limitado; identidade própria de máquina e connection instance; comunicação outbound autenticada/criptografada como padrão; credenciais protegidas localmente; permissões mínimas e allowlists; pacote e atualizações assinados; atualização gradual e rollback seguro; health/heartbeat; comandos remotos allowlisted e auditados; isolamento de processo e limites de recursos; logs sem segredos; suspensão, rotação e revogação remota. Não exigir portas inbound como padrão. Sistemas operacionais e métodos suportados devem ser declarados e homologados.

## 12. Abrangência de conectividade

Além de API, Database e Files, a UIP prevê Secure Transfer (SFTP/FTPS), Healthcare Interoperability (HL7 v2, FHIR R4, RNDS, TISS, DICOM por perfil), Messaging/Brokers, Local Network Agent, Legacy/Proprietary Adapters e UI Automation como último recurso controlado. Nenhuma família implica suporte universal sem adapter, contrato, autorização e homologação específicos.

## 13. Control Plane, Data Plane e SDK

Control Plane: Connector/Adapter/Manifest Registry, Connection Manager, Credential & Secret Manager, Capability Registry, Mapping Registry, Policy/Permission Engine, Version & Dependency Manager, Approval & Lifecycle Manager.

Data Plane: Connector Runtime, Local Agent, Discovery, Extraction, Ingestion, Transformation, Validation/Quarantine, Identity Resolution, Data Quality & Lineage, Reconciliation, Event & Sync, Delivery/Retry e Observability.

Tysvora Connector SDK deve oferecer interfaces, tipos, abstrações de autenticação, discovery, extraction/delivery, erros, idempotência, telemetria, conformance test harness, empacotamento, assinatura e documentação. Terceiros só publicam adapters após identificação, revisão, assinatura, permissões declaradas e testes de conformidade.

## 14. Versionamento e ciclo de vida

Versionar independentemente pacote, contrato, manifest, mapping e schema; declarar compatibilidade. Capability negotiation verifica capacidades reais. Lifecycle: proposta → revisão de segurança/dependências → assinatura/verificação → conformance tests → homologação → aprovação institucional → rollout gradual → operação → atualização/rollback → suspensão/revogação/depreciação.

## 15. Modos de sincronização e reconciliação

Real-time/event-driven, near-real-time, webhook, polling, batch agendado, incremental, full reconciliation e on-demand. Exigir checkpoint/cursor/watermark, idempotency key, deduplicação, retry/backoff, dead-letter, replay autorizado, drift detection e recuperação após desconexão. Não assumir exactly-once. Escrita externa requer capacidade declarada, autorização específica e interface oficial.

## 16. Critérios de autoatendimento e homologação

Homologar ao menos: API REST/OAuth/webhook; PostgreSQL; SQL Server ou outro banco heterogêneo; CSV/XLSX variável; SFTP; endpoint FHIR; fonte acessível apenas pelo agente local; cadastro manual e integração CRM.

Medir taxa de conclusão sem assistência, tempo/esforço por fonte, tempo até primeiro dado útil, sucesso de pareamento, reutilização de adapters, cobertura de capabilities, qualidade de mappings, integridade de sincronização, recuperação e custo por integração. Metas serão estabelecidas após pilotos; não prometer instalação universal em prazo fixo.
