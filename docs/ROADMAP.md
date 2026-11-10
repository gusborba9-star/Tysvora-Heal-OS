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

## FASE 19 — CARE OPERATIONS CONTROL TOWER

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** F3 e F5 (identidade, tenancy e autorização); F6 (workflow, eventos, comunicação e notificações); F7 (domínio e governança); F8 (Sentinela); F9 (experiências). ADR-002, ADR-005, ADR-017 e decisões de SLA/escalonamento aplicáveis.

**Objetivo:** transformar manifestações, alertas, solicitações e falhas operacionais em trabalho rastreável até o desfecho.

**Entregas:**
1. Central de Pendências Assistenciais e Operacionais, distinta de caixa de mensagens/notificações;
2. filas por instituição, unidade, equipe, programa, categoria e prioridade;
3. atribuição, aceite, transferência, prazos/SLA, pausa justificada, escalonamento, reabertura e encerramento;
4. vínculo com Person/CareSubject, CareRelationship, Encounter, CarePlan, documento, mensagem, integração, visita e origem;
5. trilha de responsabilidade e histórico de transições;
6. painéis de pendências abertas, vencidas, sem responsável, recorrentes e por tempo de resolução;
7. políticas para alertas críticos e contingência, sem supressão por preferências comuns.

**Gate:** E2E manifestação → contexto → fila → responsável → decisão/ação → resultado → encerramento; testes de duplicidade, retry, transferência, escalonamento, SLA, falha de notificação, revogação de acesso e auditoria. Pendência não equivale a decisão clínica; triagem e decisões clínicas permanecem com profissional habilitado.

## FASE 20 — CONTEXT GRAPH, DATA RECONCILIATION & PROGRAM LIBRARY

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** F3, F5, F6, F7 e F10; ADR-003, ADR-004, ADR-005, ADR-009, ADR-010 e ADR-011 conforme escopo.

**Objetivo:** oferecer contexto longitudinal navegável, dados reconciliados e implantação acelerada por modelos governados.

**Entregas:**
- grafo lógico de relações entre pessoa/sujeito, instituição, unidade, equipe, profissional, programa, atendimento, plano, prescrição/ordem, exame, documento, manifestação, tarefa, visita e desfecho;
- reconciliação de divergências com fonte, autoria, timestamp, qualidade, autoridade por atributo e revisão humana;
- deduplicação, lineage, correção não destrutiva, desfazimento de vínculo e preservação dos dados originais;
- biblioteca versionada de programas/modelos operacionais para diabetes, tabagismo, hipertensão, saúde mental, pré-natal, nutrição, reabilitação, entre outros e modelos veterinários;
- clone/configuração institucional de modelos sem reescrever a origem;
- formulários, etapas, tarefas, frequência, indicadores, papéis e mensagens como artefatos governados.

**Gate:** E2E com fontes conflitantes, matching errado e reversão; autorização contextual no grafo; cinco ou mais modelos demonstrativos; versionamento sem reescrever inscrições históricas; validação e aprovação de conteúdo clínico, instrumentos e licenças aplicáveis. Grafo não amplia permissões de acesso.

## FASE 21 — WORKFORCE MANAGEMENT & SELF-SERVICE

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** F3, F4, F5, F6, F9, F12 e F13; integração com F19 e F22. ADRs de identidade, autorização, auditoria, dados e jurisdição aplicáveis.

**Objetivo:** permitir que instituições administrem equipe clínica, administrativa e operacional, disponibilidade e rotina em conexão com a capacidade assistencial.

**Entregas incrementais:**
1. cadastro de equipe, funções, credenciais, vínculos, unidades e equipes;
2. jornadas, carga horária, turnos, escalas, plantões e cobertura;
3. férias, folgas, licenças, afastamentos, atestados, solicitações, aprovações e substituições;
4. registros de jornada, banco de horas, compensações e ajustes autorizados;
5. atividades, atendimentos, tarefas, visitas e atribuições;
6. alertas de conflito, indisponibilidade, cobertura insuficiente e sobrecarga;
7. Workforce Self-Service para consulta e solicitações do colaborador;
8. integração com ponto/folha/RH quando necessária, sem presumir substituição desses sistemas;
9. indicadores de cobertura, disponibilidade e distribuição de carga.

**Gate:** testes multi-vínculo/multiunidade; separação entre pessoa, profissional, colaborador, vínculo e permissões; aprovação e trilha de férias/ausências; regras de jornada parametrizadas por jurisdição; proteção de dados de atestados; prevenção de conflitos de escala; cálculos reconciliados com sistema de ponto quando integrado. Não declarar conformidade trabalhista universal nem equivalência a folha de pagamento sem validação específica.

## FASE 22 — INTERNATIONALIZATION & LOCALIZATION

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** fundações de experiência da F9, governança de conteúdo da F7, notificações/documentos da F6/F17 e Control Center da F13. Requer inventário de strings, conteúdo e formatos regionais.

**Objetivo:** tornar toda a plataforma multilíngue sem duplicar produtos nem alterar silenciosamente o significado dos dados.

**Entregas:**
- infraestrutura i18n/l10n com pt-BR inicial e inglês (en);
- preferência individual de idioma, default institucional e idioma de comunicação por paciente;
- tradução de todas as experiências, Control Center, mensagens, notificações, erros, formulários e conteúdo de onboarding;
- formatos localizados de data, hora, fuso, calendário, números, moedas e unidades;
- metadados de idioma original e traduções derivadas para conteúdo e documentos;
- preservação do original, identificação de tradução automática/humana, versão, autoria e revisão;
- suporte a expansão de variantes regionais e preparação por jurisdição.

**Gate:** cobertura de strings sem fallback quebrado; testes de alternância de idioma em todas as experiências; conteúdo e notificações no idioma configurado; documentos originais preservados; traduções claramente identificadas; testes de timezone, formatos e acessibilidade. Internacionalização não autoriza lançamento em jurisdição sem revisão legal, regulatória, fiscal, privacidade e interoperabilidade.

## FASE 23 — CAPACITY ENGINE, FIELD OPTIMIZATION & OPERATIONAL ANALYTICS

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** F8, F9, F12, F19 e F21; F6/F10 para qualidade dos dados; ADR-010/011/012/013 conforme escala, offline e analytics.

**Objetivo:** otimizar capacidade institucional e coordenação de trabalho remoto, presencial e de campo, sem subordinar segurança à produtividade.

**Entregas:**
- visão de demanda, capacidade disponível, competência, habilitação, jornada, carga, agenda, território e restrições;
- identificação de gargalos, filas, unidades descobertas, concentração de visitas e capacidade ociosa;
- simulação e recomendação de redistribuição, cobertura e agrupamento geográfico;
- apoio a decisão de modalidade remota/presencial somente dentro de critérios profissionais e institucionais;
- indicadores de tempo até resposta/resolução, carga, cobertura, visitas, continuidade, retrabalho, capacidade e custo;
- baseline e método para medir impacto econômico e operacional.

**Gate:** cenários E2E com ausência, sobrecarga, unidade descoberta, visita, equipe multidisciplinar e restrições de competência/jornada; explicabilidade das recomendações; aprovação humana para redistribuições sensíveis; métricas com definição, lineage, privacidade e baseline. Alegações de economia exigem piloto controlado e resultado medido.

## FASE 24 — GOVERNED OPERATIONAL COPILOT & PATIENT JOURNEY

**STATUS: PLANEJADA — NÃO IMPLEMENTADA**
**Dependências:** F7, F8, F9, F11, F17, F19 e controles F5/F13; ADR-014 e governança clínica aplicáveis.

**Objetivo:** reduzir trabalho administrativo e tornar a experiência do paciente mais transparente, mantendo autoridade humana e fontes verificáveis.

**Entregas:**
- copiloto para resumo de contexto autorizado, extração/classificação documental, estruturação de conversas e rascunhos para revisão;
- resumo de filas e pendências, busca autorizada e sugestão de tarefas administrativas;
- apresentação de fontes, limitações, incerteza, versão de modelo/política e registro de validação;
- Patient Journey com programas, metas, orientações vigentes, compromissos, documentos e solicitações compartilháveis;
- distinção visual entre dado profissional, importado e autorrelatado;
- mecanismos de correção, contestação e feedback.

**Gate:** avaliação por tarefa, qualidade e segurança; proteção contra prompt injection; minimização de dados; fallback; custo/latência; validação humana; ausência de ações clínicas autônomas; testes de direitos do paciente, segregação institucional e preservação de documentos originais.

## Requisitos transversais — novas capacidades

- Toda pendência possui responsável, prazo, origem, contexto, estado e desfecho; mensagem e notificação não são substitutos de workflow.
- Context Graph respeita as mesmas políticas de tenancy, finalidade, vínculo e menor privilégio do Core.
- Reconciliação nunca sobrescreve silenciosamente dados conflitantes; preserva fonte e histórico.
- Modelos de programa são versionados, configuráveis e governados; conteúdo clínico requer aprovação.
- Workforce Management separa pessoa, profissional, colaborador, vínculo, função e credencial; não pressupõe vínculo empregatício.
- Dados de atestado e saúde ocupacional são restritos e minimizados; regras de jornada dependem de jurisdição e contrato.
- Capacity Engine não substitui decisão clínica nem viola habilitação, descanso, jornada ou segurança.
- Idioma da interface, idioma da instituição, idioma de comunicação e idioma original de documento são dimensões distintas.
- Traduções não substituem o original nem se apresentam como documento regulado válido sem certificação e validação aplicáveis.
- IA apoia preparação e organização; não assume decisão clínica, alocação clínica autônoma ou encerramento clínico.
- Todas as capacidades novas permanecem planejadas até implementação, testes, homologação e evidência.

