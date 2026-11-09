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
