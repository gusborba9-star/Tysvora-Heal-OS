# Universal Engine Contracts

**Status:** especificação de fronteiras e contratos; não comprova implementação.  
**Regra:** engines são limites de domínio e responsabilidade, não microserviços presumidos.

## 1. Regras comuns

Todo engine deve declarar: owner de domínio; entidades e dados sob sua autoridade; comandos aceitos; eventos publicados/consumidos; políticas de autorização; invariantes; estados; idempotência; erros; requisitos de auditoria; métricas; dependências; estratégia de versionamento e migração.

Nenhum engine pode:
- redefinir tenant, identidade ou autorização global;
- ler diretamente tabelas de outro bounded context;
- tratar mensagem como decisão clínica;
- sobrescrever histórico clínico ou documental;
- usar feature flag como autorização;
- assumir entrega exactly-once;
- expor dados sensíveis em eventos sem necessidade.

Comunicação entre contextos ocorre por contratos de aplicação/API ou eventos versionados. A escolha entre chamada síncrona e evento depende da necessidade de consistência e latência.

## 2. Matriz de responsabilidade

| Engine | Autoridade principal | Entradas | Saídas/eventos | Não é responsável por |
|---|---|---|---|---|
| Identity & Access | identidade de login, credenciais, sessões e decisões de acesso | autenticação, contexto e políticas | identity/session/access events | prontuário e elegibilidade clínica |
| Organization & Relationship | tenants, organizações, unidades, equipes e vínculos | comandos administrativos e convites | relationship/membership events | conteúdo clínico |
| Care Context | projeção contextual autorizada e referências longitudinais | fontes internas/externas e escopos | context snapshots/references | tornar fonte externa automaticamente autoritativa |
| UIP | conexões, extração, validação, mapeamento e reconciliação | API, DB, arquivos, agente local | ingestion/reconciliation events | decisão clínica e identidade sem política de matching |
| Program Engine | definições, versões e inscrições | templates, elegibilidade e comandos de programa | enrollment/stage/goal events | implementação de protocolos clínicos sem aprovação |
| Care Continuity | jornadas, planos e manifestações tipadas | encounter, report, assessment e decisão profissional | plan/event/pathway events | prescrição autônoma |
| Intake & Triage Orchestration | fila, roteamento e escalonamento operacional | relato, canal e regras aprovadas | intake/assignment/escalation events | diagnóstico ou prioridade clínica autônoma |
| Workflow & Task | execução atribuída, prazo e estado de tarefa | comandos e eventos autorizados | task lifecycle events | definir autoridade clínica |
| Engagement & Communication | mensagens, entrega, consentimento/canal e preferências | mensagens e templates aprovados | delivery/read/ack events | converter mensagem em prescrição |
| Clinical Governance | protocolos, instrumentos, ordens e documentos clínicos | decisão de profissional e protocolo aprovado | protocol/order/document events | assumir responsabilidade do profissional |
| Field Operations | agenda, atribuição logística, execução e evidência de campo | tarefas aprovadas e restrições | visit/field outcome events | redefinir prioridade clínica |
| Notification | intenção, canal, tentativa e estado de entrega | eventos e políticas de notificação | notification delivery events | ser fonte de verdade de tarefa ou mensagem |
| Sentinela | sinais e alertas explicáveis | eventos, métricas e regras | alert/acknowledgement events | diagnóstico ou ação clínica autônoma |
| Analytics & Capacity | métricas, capacidade e análises minimizadas | dados governados e lineage | métricas e recomendações operacionais | alterar registros transacionais |
| AI Gateway | execução governada de tarefas de IA | pedido autorizado e contexto minimizado | AI result/audit metadata | autoridade de domínio ou execução sem permissão |

## 3. Contratos críticos

### CareEvent vs Message vs Alert
- Message é conteúdo de comunicação entre atores.
- CareEvent é relato/manifestaçao tipada, com autor, sujeito, tempo e contexto.
- Alert é sinal gerado por regra/engine e deve apontar evidência e política.
- Uma mensagem pode originar um CareEvent por ação explícita ou regra aprovada; não são intercambiáveis.

### CareTask vs Workflow
- Workflow define processo, transições e condições.
- CareTask é unidade de trabalho atribuída a responsável, com prazo, escopo e resultado.
- Uma transição pode criar, atualizar ou encerrar tarefas; não deve criar duplicatas em retries.

### CarePlan vs CareOrder/Prescription
- CarePlan representa plano/jornada e metas.
- CareOrder expressa ordem profissional específica.
- Prescription é tipo regulado de ordem/documento, sujeito a assinatura, validade e regras legais.
- Atualizar plano não altera automaticamente prescrição vigente.

### Program vs Module vs Protocol
- Program é configuração operacional versionada e inscrição.
- Module é pacote de software ativável.
- Protocol é artefato profissional/técnico aprovado e versionado.
- Nenhum dos três substitui os outros.

### SourceRecord vs Care Context
- SourceRecord preserva registro e identidade da fonte.
- Care Context projeta apenas informações relevantes e autorizadas.
- A projeção nunca apaga origem, qualidade ou divergência.

## 4. Dependências direcionais

- Identity & Access → Organization & Relationship para validar contexto, sem delegar autorização.
- UIP → identidade/matching governado → Care Context; ingestão não concede acesso.
- Program Engine → Organization & Relationship, CareSubject, Workflow/Task e protocolos aprovados.
- Care Continuity → Care Context, Clinical Governance e Workflow/Task.
- Intake → Engagement, Care Continuity, Workflow/Task e Clinical Governance quando triagem clínica for aplicável.
- Field Operations → Workflow/Task, Organization/Relationship, Engagement e políticas de localização.
- Sentinela/Analytics → eventos e dados minimizados; não escrevem no domínio operacional.
- AI Gateway → policy engine, minimização, validação e auditoria; domínios chamam o gateway, não provedores diretamente.

## 5. Contrato de comando e evento

Comando mutável deve incluir command_id/idempotency_key, actor, tenant/context, purpose, target, payload validável e expected_version quando houver concorrência otimista. Resultado deve ser explícito: accepted, rejected, pending ou completed.

Evento deve incluir event_id, type/schema_version, occurred_at/recorded_at, actor/source, tenant/context, subject/reference, correlation_id, causation_id, idempotency_key e classificação. Payload deve ser minimizado. Consumidor deduplica e valida versão.

## 6. Consistência e falhas

- Operações no mesmo agregado usam transação e controle de concorrência.
- Efeitos externos são assíncronos quando possível; estado de envio não equivale a estado de domínio.
- Outbox/inbox ou padrão equivalente será decidido por ADR antes de eventos críticos em produção.
- Retry é limitado, com backoff e dead-letter; replay exige autorização e auditoria.
- Conflito de versão retorna conflito explícito; não aplicar last-write-wins em plano, ordem ou documento.
- Falha parcial deve ser visível e recuperável sem duplicar efeitos.

## 7. Definition of Ready de um engine

Antes da implementação: owner aprovado; bounded context e ownership de dados; contratos de comando/evento/API; modelo de autorização; estados e invariantes; riscos clínicos/privacidade; dependências; ADRs; testes de contrato/isolamento/idempotência; observabilidade e plano de migração/rollback.
