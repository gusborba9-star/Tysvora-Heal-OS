# Blueprint → Roadmap → Specification → Execution Traceability

**Status:** baseline de rastreabilidade documental para aprovação.  
**Regra:** “especificado” não significa “implementado”. Execução só existe quando houver ID, escopo autorizado, commit, testes e evidências.

| Capacidade / requisito | Blueprint | Roadmap | Especificação normativa | Fase/execução futura | Evidência exigida |
|---|---|---|---|---|---|
| Tenancy, organização e unidade | §7–11 | F3, F5 | CORE-FOUNDATION; SECURITY; DATA | auditar F3/F5 | testes negativos tenant/org/unit |
| Identity, Person, Professional, CareSubject, Guardian | §11 | F3, F5, F7 | DOMAIN-MODEL; SECURITY | F3/F5/F7 | identidade, vínculo, representação e revogação |
| RBAC + ABAC e purpose limitation | §7, §13, §15 | F5 | SECURITY; CLINICAL-GOVERNANCE | F5 | matriz allow/deny, break-glass e trilha |
| Program Definition/Version/Enrollment | §4, §10–12 | F7 | PROGRAM-ENGINE; DOMAIN-MODEL | F7 | cinco programas-modelo, versionamento e migração |
| CarePathway, Encounter, CarePlan e CareEvent | §11–13 | F7, F9 | CARE-CONTINUITY; DOMAIN-MODEL | F7/F9 | ciclo completo, autoria e histórico |
| Message, notification, alert e intake | §12, §16 | F6, F8, F9 | ENGINE-CONTRACTS; EVENT-ARCHITECTURE | F6/F8/F9 | semântica distinta, retry e roteamento |
| CareTask, workflow e execução | §9, §12, §17 | F6, F9 | ENGINE-CONTRACTS; FIELD-OPERATIONS | F6/F9 | atribuição, transições, idempotência e encerramento |
| UIP API/DB/files/local agent | §14 | F6, F10 | UNIVERSAL-INTEGRATION; DATA-PROVENANCE | F6/F10 | conector E2E, checkpoint, replay e reconciliação |
| Proveniência e autoridade por atributo | §14 | F6, F10, F12 | DATA-PROVENANCE; DATA-ARCHITECTURE | F6/F10 | fonte, lineage, conflito e correção não destrutiva |
| Prescrição, CareOrder e documentos | §11, §15 | F7, F9, F14 | CLINICAL-GOVERNANCE; CARE-CONTINUITY | F7/F9/F14 | assinatura válida, integridade, versão e status |
| Tysvora Institution/Patient/Field | §6, §13 | F9 | PRODUCT-EXPERIENCE | F9 | autorização por experiência e jornada real |
| Field Operations / visita domiciliar | §17, §21 | F6, F9, F14 | FIELD-OPERATIONS | F6/F9/F14 | agendamento, execução, evidência e contingência |
| Sentinela e alertas explicáveis | §16 | F8 | AI-ARCHITECTURE; ENGINE-CONTRACTS | F8 | precisão, falso positivo, explicação e ação humana |
| AI Gateway governado | §16 | F11 | AI-ARCHITECTURE | F11 | avaliação, fallback, segurança e aprovação humana |
| Analytics e otimização de capacidade | §17 | F12 | CAPACITY-OPTIMIZATION; DATA-ARCHITECTURE | F12 | definição de métrica, lineage e piloto medido |
| Modularidade e ativação governada | §7, §18 | F4, F16 | MODULE-ARCHITECTURE | F4/F16 | dependências, compatibilidade, suspensão e rollback |
| Produção, observabilidade e recuperação | §19 | F13–F15 | ARCHITECTURE; DATA; SECURITY | F13/F14/F15 | restore, RPO/RTO, rollback e readiness |

## Cenários E2E de arquitetura

| ID | Cenário | Especificações principais | Gate de homologação |
|---|---|---|---|
| E2E-01 | Nutrição: dificuldade com plano, revisão profissional e nova versão | CARE-CONTINUITY; CLINICAL-GOVERNANCE; PRODUCT-EXPERIENCE | relato vinculado ao plano vigente, decisão humana, versão nova e histórico |
| E2E-02 | Medicina: persistência de dor e nova prescrição | CARE-CONTINUITY; CLINICAL-GOVERNANCE; SECURITY | avaliação profissional, validação legal/assinatura, versão anterior preservada |
| E2E-03 | UBS: recaída em tabagismo até visita domiciliar | PROGRAM-ENGINE; FIELD-OPERATIONS; ENGINE-CONTRACTS | contexto autorizado, prioridade profissional, tarefa, visita e resultado |
| E2E-04 | Programas simultâneos | PROGRAM-ENGINE; DOMAIN-MODEL; SECURITY | isolamento de equipe, finalidade e dados entre programas |
| E2E-05 | Multi-instituição | DOMAIN-MODEL; SECURITY; PRODUCT-EXPERIENCE | isolamento por padrão e compartilhamento explícito auditado |
| E2E-06 | Veterinária: animal e tutor | DOMAIN-MODEL; PROGRAM-ENGINE; SECURITY | CareSubject animal e Guardian com escopo delegado |
| E2E-07 | UIP: conflito entre sistema externo e dado institucional | UNIVERSAL-INTEGRATION; DATA-PROVENANCE | origem, conflito, autoridade por atributo e reconciliação |
| E2E-08 | Operação de campo | FIELD-OPERATIONS; CAPACITY-OPTIMIZATION | competência, território, carga, prioridade clínica preservada e encerramento |

## Regras de atualização

Toda execução deve referenciar os requisitos/IDs afetados e atualizar status com evidência. Status permitidos: NÃO INICIADO, ESPECIFICADO, EM EXECUÇÃO, EM AUDITORIA, CONCLUÍDO/APROVADO, BLOQUEADO. Um requisito só muda para CONCLUÍDO/APROVADO com evidência técnica e aceite formal.


## Requisitos adicionais — autoatendimento e superfícies

| Capacidade / requisito | Blueprint | Roadmap | Especificação normativa | Fase/execução futura | Evidência exigida |
|---|---|---|---|---|---|
| Easy Connect e Progressive Integration | §14, §25 | F6, F10 | UNIVERSAL-INTEGRATION; PRODUCT-EXPERIENCE | F6/F10 | onboarding self-service, teste, aprovação, monitoramento e recuperação |
| Connector Agent local | §14, §25 | F6, F10, F13 | UNIVERSAL-INTEGRATION; ADR-008/020 | F6/F10 | pareamento, outbound seguro, assinatura, atualização, isolamento e revogação |
| Universal Data Intake: upload/manual/CRM/ERP | §14, §19, §25 | F6, F9 | UNIVERSAL-INTEGRATION; PRODUCT-EXPERIENCE | F6/F9 | preview, quarantine, mapping, lineage, duplicidade e aprovação |
| Institutional Workspace Premium | §6, §26 | F9 | PRODUCT-EXPERIENCE | F9 | visão institucional com escopo, filtros por papel/finalidade e isolamento |
| Tysvora Professional | §6, §26 | F9 | PRODUCT-EXPERIENCE; CARE-CONTINUITY | F9 | workspace profissional, autoria, vínculo e autorização |
| Tysvora Patient | §6, §26 | F9 | PRODUCT-EXPERIENCE; SECURITY | F9 | multi-instituição segregada, convite, revogação e acesso mínimo |
| Tysvora Field | §6, §26 | F9 | PRODUCT-EXPERIENCE; FIELD-OPERATIONS | F9 | tarefa/visita, proteção de dispositivo e sincronização |
| Tysvora Control Center | §6, §26 | F13 | PRODUCT-EXPERIENCE; SECURITY; MODULE-ARCHITECTURE | F13 | administração da plataforma sem acesso clínico global; suporte excepcional auditado |


## Requisitos adicionais — sistema principal, comunicação e monetização

| Capacidade / requisito | Blueprint | Roadmap | Especificação normativa | Fase/execução futura | Evidência exigida |
|---|---|---|---|---|---|
| Clinical Record Core nativo / modo Primary System | §27 | F7, F9, F17 | PRIMARY-CLINICAL-SYSTEM; DOMAIN-MODEL; CLINICAL-GOVERNANCE | F17 | E2E cadastro → Encounter → evolução → plano/documento → continuidade |
| Modo Integrated Platform e Hybrid | §14, §27 | F6, F10, F17 | PRIMARY-CLINICAL-SYSTEM; UNIVERSAL-INTEGRATION; DATA-PROVENANCE | F17 | autoridade por atributo, reconciliação, sem duplicidade ou conflito silencioso |
| Secure Care Messaging bidirecional | §9, §28 | F6, F9, F17 | CARE-MESSAGING-RELATIONSHIP-LIFECYCLE; ENGINE-CONTRACTS | F17 | envio/recebimento, contexto, entrega, retry, autorização e auditoria |
| Anexos seguros no chat | §28 | F6, F17 | CARE-MESSAGING-RELATIONSHIP-LIFECYCLE | F17 | validação de arquivo, malware, URLs temporárias, criptografia e acesso |
| Clinical Document Management | §11, §15, §28 | F7, F9, F17 | PRIMARY-CLINICAL-SYSTEM; CLINICAL-GOVERNANCE | F17 | autoria, assinatura válida quando exigida, integridade, versão e status |
| Áudio opcional com controle administrativo | §28 | F13, F17 | CARE-MESSAGING-RELATIONSHIP-LIFECYCLE | F17 | default off, flag global/plano, opt-in institucional, limites, custo e retenção |
| Silenciar e preferências de comunicação | §29 | F9, F17 | CARE-MESSAGING-RELATIONSHIP-LIFECYCLE | F17 | notificações comuns silenciadas sem suprimir alertas críticos |
| Encerrar/transferir CareRelationship | §11, §29 | F5, F7, F9, F17 | CARE-MESSAGING-RELATIONSHIP-LIFECYCLE; SECURITY | F17 | histórico preservado, justificativa, transição, direitos e auditoria |
| Tysvora Store / catálogo comercial | §30 | F18 | MODULAR-COMMERCE-STORE | F18 | catálogo dinâmico e elegibilidade por tenant |
| Planos, franquias e acessos adicionais | §30 | F18 | MODULAR-COMMERCE-STORE | F18 | limites, excedentes, contagem de ativos e isolamento |
| Add-ons e provisionamento automático | §30 | F4, F18 | MODULAR-COMMERCE-STORE; MODULE-ARCHITECTURE | F18 | contratação → entitlement → provisionamento → uso |
| Billing, metering e reconciliação | §30 | F18 | MODULAR-COMMERCE-STORE | F18 | consumo, fatura, pagamento, reconciliação, cancelamento e inadimplência |
