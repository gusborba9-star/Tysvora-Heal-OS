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
**STATUS: DOCUMENTAÇÃO EM REVISÃO**
Objetivo: alinhar Blueprint, experiências, domínio universal, programas, jornadas, governança clínica, integração, dados e benchmark.
Entregáveis:
- Blueprint 2.0;
- Roadmap 2.0;
- Product Experience;
- Domain Model 2.0;
- Program Engine;
- Care Continuity;
- Universal Integration;
- Data Provenance;
- Clinical Governance;
- Field Operations;
- Capacity Optimization;
- Competitive Benchmark;
- ADRs e matriz de rastreabilidade.
Gate: consistência documental, cenários E2E modelados, lacunas e decisões pendentes explícitas, aceite CTO. Nenhum código novo autorizado por esta fase.

## FASE 3 — HEAL CORE
**STATUS HISTÓRICO: EM EXECUÇÃO**
Preservar Execuções 03, 03A, 04, 04B e 05 e seus registros originais. A correção 04B e configuração 05 continuam aprovadas conforme evidências já registradas; não extrapolar esse aceite para todo o Core.
Objetivo: concluir e validar capacidades transversais previstas, incluindo persistência, identidade, contexto, autorização, auditoria, eventos e contratos necessários.
Gate adicional: validar o Core contra Person/UserIdentity/Professional/CareSubject/Guardian e relacionamentos multi-institucionais sem inserir regras clínicas no Core. Não alterar contratos já validados sem ADR e regressão.

## FASE 4 — PLATFORM & MODULE GOVERNANCE
Objetivo: Module Registry, manifests, versões, dependências, contratos, feature flags, ciclo de vida e governança de configurações.
Gate: módulos podem ser ativados/suspensos com auditoria; feature flags nunca substituem autorização.

## FASE 5 — IDENTITY, SECURITY & PRIVACY
Objetivo: identidade, RBAC + ABAC/contexto, tenancy, multi-instituição, consentimentos/base legal, segregação, auditabilidade, LGPD e controles técnicos.
Gate: testes negativos entre tenants, organizações, unidades, programas e relacionamentos; revogação e break-glass auditados.

## FASE 6 — UNIVERSAL ENGINES & INTEGRATION FOUNDATION
Objetivo: contratos e capacidades compartilhadas de workflow, tarefas, notificações, documentos, busca, comunicação, integração e proveniência.
Entregas incrementais: Integration Gateway/UIP, conectores API, arquivos, DB, agente local; ingestão, mapeamento, qualidade, sincronização e reconciliação.
Gate: conector de referência ponta a ponta com origem, idempotência, falha, retry, reconciliação e auditoria.

## FASE 7 — DOMAIN, PROGRAM & CLINICAL GOVERNANCE
Objetivo: modelo universal de domínio, Program Engine, CarePathway, protocolos, instrumentos, ordens/documentos e limites profissionais.
Gate: cinco cenários mínimos — tabagismo UBS, diabetes rede, depressão clínica, nutrição individual e veterinária — modelados sem duplicar Core. Homologação clínica/legal separada de testes técnicos.

## FASE 8 — SENTINELA & OPERATIONAL INTELLIGENCE
Objetivo: sinais, regras, alertas, escalonamento, filas, atrasos, anomalias e explicabilidade.
Gate: alertas com fonte, regra, prioridade, destinatário, falso positivo monitorado e ação humana. Não emitir diagnóstico autônomo.

## FASE 9 — CARE EXPERIENCE & FIRST VERTICAL/PROGRAM
Objetivo: Institution, Patient e Field experiences; Unified Care Workspace; primeira jornada vertical/programa.
Gate: jornada completa da entrada ao acompanhamento, decisão profissional, tarefa, retorno e auditoria; usabilidade e acessibilidade validadas.

## FASE 10 — INTEROPERABILITY DELIVERY
Objetivo: conectores homologados, mapeamentos, FHIR/RNDS quando aplicáveis, monitoramento e operação de sincronização.
Gate: homologação por sistema e fonte. Nunca declarar interoperabilidade universal por suportar um padrão apenas.

## FASE 11 — GOVERNED AI GATEWAY
Objetivo: abstração de provedores, roteamento, políticas, avaliações, custo, segurança, supervisão e auditabilidade.
Gate: avaliação por caso de uso, limites de dado, validação de saída, fallback seguro e aprovação humana para uso sensível.

## FASE 12 — ANALYTICS & CAPACITY OPTIMIZATION
Objetivo: indicadores de programa, jornada, equipe, unidade e rede; filas, capacidade, remoto/presencial, campo, custos e resultados.
Gate: definições de métricas, qualidade e lineage, privacidade e validação de utilidade. Alegações de economia exigem piloto medido.

## FASE 13 — DEPLOYMENT & OPERATIONS CENTER
Objetivo: releases reproduzíveis, ambientes, configuração, secrets, observabilidade, backup, recuperação, suporte e atualização.
Gate: RPO/RTO, restore testado, monitoramento, rollback, gestão de incidentes e runbooks.

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
