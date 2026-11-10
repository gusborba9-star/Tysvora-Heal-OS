# Tysvora Heal OS — Roadmap 2.0

**Status:** reorganização macro proposta; fases históricas preservadas.  
**Regra:** fase descrita não significa implementação ou autorização automática.

## Governança de status

Usar apenas: NÃO INICIADA, EM EXECUÇÃO, EM AUDITORIA, BLOQUEADA, CONCLUÍDA/APROVADA. Cada conclusão exige commit, CI/testes pertinentes, evidência, escopo e aceite formal do CTO.

## FASE 0 — GOVERNANÇA
Objetivo: autoridade documental, decisões, versionamento e execução controlada.  
Conclusão: hierarquia documental e gates aprovados.

## FASE 1 — FUNDAÇÃO
**STATUS: CONCLUÍDA** conforme registro histórico.  
Preservar commit e aceite existentes. A conclusão documental original não representa produto completo.

## FASE 2 — ARQUITETURA TÉCNICA
**STATUS: CONCLUÍDA** conforme registro histórico.  
A arquitetura técnica existente permanece como base; documentos são atualizados sem apagar histórico de aprovação. A nova visão exige revisão de arquitetura antes de implementação de novas capacidades.

## FASE 2A — PRODUCT & ARCHITECTURE LOCK
**STATUS: CONCLUÍDA/APROVADA — ESCOPO DOCUMENTAL (2026-11-09)**
Objetivo: alinhar Blueprint, experiências Patient/Professional/Institution/Field, fronteira do Control Center, Institutional Workspace Premium, domínio universal, programas, jornadas, governança clínica, UIP/Easy Connect, Connector Agent, Universal Data Intake e benchmark.
Entregáveis:
- Blueprint 2.0;
- Roadmap 2.0;
- Product Experience — Patient, Professional, Institution, Field e Control Center;
- Easy Connect, Connector Agent e Universal Data Intake especificados na UIP;
- Domain Model 2.0;
- Program Engine;
- Care Continuity;
- Universal Integration;
- Data Provenance;
- Clinical Governance;
- Field Operations;
- Capacity Optimization;
- Competitive Benchmark;
- `docs/architecture/ENGINE-CONTRACTS.md` — fronteiras, ownership, comandos, eventos e dependências dos engines;
- `docs/architecture/ADR-REGISTER.md` — registro de decisões abertas e ordem sugerida;
- `docs/architecture/TRACEABILITY-MATRIX.md` — rastreabilidade Blueprint → Roadmap → Especificações → Execuções;
- `docs/architecture/E2E-ARCHITECTURE-SCENARIOS.md` — oito cenários de arquitetura ponta a ponta;
- `docs/architecture/PHASE-2A-CLOSURE-REPORT.md` — auditoria, evidências, riscos residuais e decisão de fechamento.

**Resultado do gate:** documentação, fronteiras, rastreabilidade, cenários e decisões pendentes revisados. Fechamento limitado ao escopo documental por solicitação explícita do CTO em 2026-11-09. ADRs permanecem abertos conforme seus gates. Nenhum código, migração, dado real ou deploy é autorizado automaticamente por esta conclusão.

## FASE 3 — HEAL CORE
**STATUS HISTÓRICO: EM EXECUÇÃO**
Preservar Execuções 03, 03A, 04, 04B e 05 e seus registros originais. A correção 04B e configuração 05 continuam aprovadas conforme evidências já registradas; não extrapolar esse aceite para todo o Core.
Objetivo: concluir e validar capacidades transversais previstas, incluindo persistência, identidade, contexto, autorização, auditoria, eventos e contratos necessários.
Gate adicional: validar o Core contra Person/UserIdentity/Professional/CareSubject/Guardian e relacionamentos multi-institucionais sem inserir regras clínicas no Core. Não alterar contratos já validados sem ADR e regressão.

## FASE 4 — PLATFORM & MODULE GOVERNANCE
**Dependências:** Fase 3 e contratos de engine aprovados. Pode iniciar desenho documental em paralelo, mas ativação técnica depende de autorização e isolamento da Fase 5.
Objetivo: Module Registry, manifests, versões, dependências, contratos, feature flags, ciclo de vida e governança de configurações.
Gate: módulos podem ser ativados/suspensos com auditoria; compatibilidade, rollback e ownership verificados; feature flags nunca substituem autorização.

## FASE 5 — IDENTITY, SECURITY & PRIVACY
**Dependências:** contratos do Core da Fase 3; decisões ADR-004, ADR-005 e ADR-016.
Objetivo: identidade, RBAC + ABAC/contexto, tenancy, multi-instituição, consentimentos/base legal, segregação, auditabilidade, LGPD e controles técnicos.
Gate: testes negativos entre tenants, organizações, unidades, programas, CareSubject e Guardian; revogação, purpose limitation e break-glass auditados. É pré-requisito para dados reais em engines e conectores.

## FASE 6 — UNIVERSAL ENGINES, UIP & EASY CONNECT FOUNDATION
**Dependências:** contratos da Fase 3; controles mínimos da Fase 5; ADR-002, ADR-008, ADR-017 e ADR-020 para produção de eventos/conectores/comunicação e agente local.
Objetivo: contratos e capacidades compartilhadas de workflow, tarefas, notificações, documentos, busca, comunicação, UIP, proveniência e autoatendimento.
Entregas incrementais: Control Plane/Data Plane; Connector SDK/Registry/manifests/contracts/capability negotiation/conformance; Easy Connect guiado; Universal Data Intake (upload, manual, CRM/ERP); API, Database, File/Document, Secure Transfer e padrões de saúde; Connector Agent com pareamento/assinatura/atualização/revogação; mappings, lineage, qualidade, identidade governada, sincronização e reconciliação.
Gate: onboarding self-service testado; conector por família priorizada; importação com preview/quarentena/aprovação; agente com threat model e atualização segura; E2E com idempotência, falha, retry, replay, conflito, reconciliação, auditoria e isolamento. Nenhuma integração produtiva antes dos ADRs e gates aplicáveis.

## FASE 7 — DOMAIN, PROGRAM & CLINICAL GOVERNANCE
**Dependências:** Fases 3 e 5; Fase 6 para dependências de workflow/eventos quando usadas; ADR-004, ADR-006, ADR-007, ADR-015 e ADR-018 conforme escopo.
Objetivo: modelo universal de domínio, Program Engine, CarePathway, protocolos, instrumentos, ordens/documentos e limites profissionais.
Gate: cinco cenários mínimos — tabagismo UBS, diabetes rede, depressão clínica, nutrição individual e veterinária — modelados sem duplicar Core. Homologação clínica/legal separada de testes técnicos.

## FASE 8 — SENTINELA & OPERATIONAL INTELLIGENCE
Objetivo: sinais, regras, alertas, escalonamento, filas, atrasos, anomalias e explicabilidade.
Gate: alertas com fonte, regra, prioridade, destinatário, falso positivo monitorado e ação humana. Não emitir diagnóstico autônomo.

## FASE 9 — CARE EXPERIENCES & FIRST VERTICAL/PROGRAM
**Dependências:** Fases 3, 5, 6 e 7; contratos API e segurança aprovados.
Objetivo: entregar Patient, Professional, Institution (Institutional Workspace Premium) e Field; Unified Care Workspace; primeira jornada vertical/programa. Control Center interno deve ter fronteira administrativa definida, com entrega faseada na F13.
Entregas incrementais: navegação por experiência, contexto institucional explícito, permissões server-side, workspace profissional, painel institucional consolidado, Patient multi-instituição segregado, Field, convites e onboarding.
Gate: jornada completa da entrada ao acompanhamento, decisão profissional, tarefa, retorno e auditoria; isolamento entre experiências e papéis; usabilidade e acessibilidade validadas.

## FASE 10 — INTEROPERABILITY DELIVERY
**Dependências:** UIP de referência da Fase 6; ADR-008/009; controles de segurança e proveniência aprovados.
Objetivo: conectores homologados, mapeamentos, FHIR/RNDS quando aplicáveis, monitoramento e operação de sincronização.
Gate: homologação por sistema e fonte. Nunca declarar interoperabilidade universal por suportar um padrão apenas.

## FASE 11 — GOVERNED AI GATEWAY
Objetivo: abstração de provedores, roteamento, políticas, avaliações, custo, segurança, supervisão e auditabilidade.
Gate: avaliação por caso de uso, limites de dado, validação de saída, fallback seguro e aprovação humana para uso sensível.

## FASE 12 — ANALYTICS & CAPACITY OPTIMIZATION
Objetivo: indicadores de programa, jornada, equipe, unidade e rede; filas, capacidade, remoto/presencial, campo, custos e resultados.
Gate: definições de métricas, qualidade e lineage, privacidade e validação de utilidade. Alegações de economia exigem piloto medido.

## FASE 13 — PLATFORM CONTROL CENTER & OPERATIONS
Objetivo: releases reproduzíveis, ambientes, configuração, secrets, observabilidade, backup, recuperação, suporte e atualização; painel interno Tysvora Control Center para tenants, planos/direitos, módulos, conectores, releases, incidentes, suporte e saúde operacional.
Gate: RPO/RTO, restore testado, monitoramento, rollback, incidentes e runbooks; segregação comprovada entre administração da plataforma e conteúdo clínico; suporte excepcional com finalidade, escopo mínimo e auditoria.

## FASE 14 — END-TO-END HOMOLOGATION
Objetivo: homologar cenários integrados, segurança, clínica, acessibilidade, operação, performance e integração.
Gate: matriz de cenários, evidências, riscos residuais e aceite formal.

## FASE 15 — PRODUCTION
Objetivo: liberar escopo homologado com operação controlada.
Gate: readiness review, suporte, monitoramento, continuidade, privacidade, contrato e rollback aprovados.

## FASE 16 — EXPANSION
Objetivo: adicionar verticais, especialidades, programas, integrações e regiões sem regressão de Core.
Gate: teste de extensibilidade, impacto, custo de manutenção, segurança e aprovação de release.

## Critérios transversais de conclusão

Toda execução deve declarar:
1. escopo e exclusões;
2. documentos/contratos afetados;
3. dependências e ADRs;
4. mudanças de dados e migração/rollback;
5. autorização e isolamento;
6. testes positivos, negativos e regressão;
7. observabilidade e falhas;
8. evidências com commit/CI;
9. riscos residuais;
10. aceite formal.

## Regra de preservação

Fases e execuções históricas não serão renumeradas nem reclassificadas retroativamente. O novo roadmap reorganiza trabalho futuro e adiciona gates. Nenhuma fase posterior fica autorizada automaticamente.


## Requisitos transversais — Easy Connect e experiências

- Instituição pode iniciar por cadastro manual ou upload, sem depender de integração externa.
- Connector Agent é opcional, instalado em ambiente institucional autorizado; navegador administra, agente executa conectividade local.
- Institutional Workspace Premium pertence à instituição; Control Center pertence à Tysvora.
- Patient, Professional, Institution e Field são experiências distintas sobre o mesmo Core, com autorização server-side.
- Homologação mede autonomia institucional, tempo/esforço por fonte, qualidade de mapping, reconciliação, recuperação e reutilização de adapters; não declarar facilidade universal sem pilotos representativos.


## FASE 17 — NATIVE CLINICAL SYSTEM & CARE MESSAGING

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** Fases 3, 5, 6 e 7; Fase 9 para experiências; ADRs de domínio, segurança, documentos, comunicação e assinatura aplicáveis.

**Objetivo:** permitir que Tysvora seja sistema principal de clínicas/instituições sem sistema adequado, além de continuar operando como plataforma integrada ou híbrida para organizações que preservam sistemas externos.

**Entregas incrementais:**
- Clinical Record Core nativo: cadastro assistencial, Encounter, evolução, CarePlan, ordens, documentos, autoria, versão, integridade e auditoria;
- configuração do modo Primary System, Integrated Platform ou Hybrid por instituição/domínio, com autoridade por atributo e fonte de verdade explícitas;
- Secure Care Messaging bidirecional entre paciente e profissional;
- anexos privados de imagem, PDF e documentos com validação, limites, antivírus, criptografia, URLs temporárias e auditoria;
- Clinical Document Management para prescrição, atestado, laudo, resultado, solicitação, encaminhamento e orientação;
- preferências de comunicação, silenciamento individual, encaminhamento e gestão de vínculo;
- encerramento e transferência de CareRelationship sem exclusão de Person, CareSubject, histórico ou documentos;
- controles de continuidade, urgência, acesso legítimo a documentos e retenção.

**Áudio:** capacidade opcional, fora do padrão inicial, desabilitada por padrão. Disponibilidade global/plano controlada pelo Control Center; ativação por instituição somente quando liberada e contratada. Custos, limites, retenção, segurança e eventual transcrição precisam ser medidos e homologados. Não é requisito para o gate inicial do chat.

**Gate:** testes E2E de sistema principal, integrado e híbrido; autoridade por atributo sem conflitos silenciosos; mensagens bidirecionais e anexos seguros; documento clínico versionado e legalmente válido quando exigido; silêncio sem perda de alertas críticos; encerramento/transferência com continuidade, direitos e auditoria. Não declarar substituição integral de EHR/ERP sem homologação específica.

## FASE 18 — MODULAR COMMERCE & TYSVORA STORE

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** F3 (tenancy/identidade), F4 (Module Registry/feature flags), F5 (segurança), F6 (UIP/serviços medidos), F13 (Control Center/operations), F14 (homologação) e F15 (readiness de produção). Cobrança produtiva depende também de provedor, contratos, regras fiscais e reconciliação validados.

**Objetivo:** entregar catálogo comercial dinâmico, contratação self-service e ativação por instituição, com governança central e direitos/limites efetivos.

**Entregas incrementais:**
1. Plan Catalog e Add-on Catalog, com Start, Institution, Network e Public & Enterprise;
2. definição de franquias por plano: profissionais, administradores, unidades e capacidades; compra de acessos adicionais;
3. catálogo de adicionais: UIP Advanced, Connector Agent adicional, Field Operations, Sentinela Intelligence, Advanced Analytics, Communication Hub, AI Services e Premium Support/SLA;
4. Tysvora Store no Institutional Workspace: elegibilidade, preço, contratação, upgrade/downgrade, cancelamento e histórico;
5. Control Center: gestão de produtos, preços, versões, disponibilidade, contratos, assinaturas, direitos, capacidade e políticas;
6. Feature Entitlements e Capacity Entitlements isolados por organização;
7. Provisioning Engine para ativação/suspensão auditável;
8. Usage Metering para IA, OCR, mensageria, áudio opcional e demais recursos variáveis;
9. Billing, invoices, pagamento, conciliação, inadimplência, tolerância, renovação e reativação;
10. Revenue Analytics, trilha comercial e reconciliação com direitos efetivos.

**Referência comercial inicial (não aprovada para publicação/cobrança):** Start R$ 199/mês; Institution R$ 899/mês; Network R$ 3.990/mês; Public & Enterprise a partir de R$ 12.000/mês. Add-ons de referência: UIP Advanced R$ 699; Connector Agent adicional R$ 299; Field Operations R$ 899; Sentinela Intelligence R$ 699; Advanced Analytics R$ 499; Communication Hub R$ 249; AI Services a partir de R$ 99 por pacote/consumo; Premium Support/SLA R$ 699. Implantação assistida, integrações especiais e migração são serviços separados. Preços e franquias exigem validação de unit economics e disposição de pagamento.

**Gate:** contratação real em sandbox e testes financeiros; isolamento por tenant; rights enforcement server-side; provisionamento, cancelamento e downgrade sem inconsistência; medição reconciliada; inadimplência e reativação testadas; conciliação financeira; auditoria; testes de abuso e falha. Nenhum preço ou produto pode ser publicado/cobrado antes do aceite formal e da evidência de operação.
