# Tysvora Heal OS — Roadmap

**Status:** Roadmap macro inicial.

Cada fase depende de validação da anterior; sua presença não significa implementação.

## FASE 0 — GOVERNANÇA
**Objetivo:** estabelecer autoridade documental, regras de execução, versionamento e decisão.  
**Entregáveis:** governança; hierarquia documental; regras de alteração e validação.  
**Dependências:** nenhuma.  
**Conclusão:** governança aprovada e adotada.

## FASE 1 — FUNDAÇÃO
**STATUS: CONCLUÍDA**  
**EXECUÇÃO:** 01  
**COMMIT:** `b252464cd31f3d40d45f1328af8615b714b0c883`  
**VALIDAÇÃO:** APROVADA PELO CTO

**Objetivo:** estabelecer a base documental controlada.  
**Entregáveis:** README, Blueprint, Roadmap, visão, princípios e fases.  
**Dependências:** FASE 0.  
**Conclusão:** documentação revisada e consistente, sem produto.

## FASE 2 — ARQUITETURA TÉCNICA
**STATUS: CONCLUÍDA**  
**EXECUÇÃO:** 02  
**COMMIT:** `7751ae9cbafd2dc6b42a329f061aeab07c25be6d`  
**VALIDAÇÃO:** APROVADA PELO CTO

**Objetivo:** transformar a arquitetura conceitual em decisões técnicas verificáveis.  
**Entregáveis:** arquitetura técnica, stack, persistência, tenancy, contratos, segurança, eventos, módulos, IA, integrações, observabilidade e deployment.  
**Dependências:** FASE 1.  
**Conclusão:** arquitetura técnica documentada, auditada e aprovada pelo CTO.

## FASE 3 — HEAL CORE
**STATUS: EM EXECUÇÃO**  
**EXECUÇÕES:** 03, 03A, 04, 04B

**Objetivo:** implementar capacidades transversais.  
**Entregáveis:** Core, organizações, unidades, usuários, configuração, eventos, auditoria, workflows e notificações autorizados.  
**Dependências:** FASE 2 aprovada.  
**ESTADO:** a Fase 3 permanece em execução até que as demais capacidades previstas sejam implementadas e aprovadas formalmente pelo CTO. A aprovação da Execução 04B não encerra a Fase 3.

### Execução 03
**STATUS:** NÃO APROVADA — EM CORREÇÃO  
**COMMIT:** `081efd677d7451b3bea2fcf761ffede701fc0cea`  
**RESULTADO:** estrutura inicial implementada; invariantes de tenancy identificadas pelo CTO como insuficientemente protegidas.

### Execução 03A
**STATUS:** EM AUDITORIA  
**OBJETIVO:** corrigir invariantes de tenancy e relacionamento entre entidades sem ampliar o escopo da FASE 3.

### Execução 04
**STATUS:** CORRIGIDA PELA EXECUÇÃO 04B; NÃO TRATAR COMO APROVAÇÃO INDEPENDENTE  
**COMMIT ORIGINAL:** `f71d668c845a1a5cbfb5c396ff752d0eeca6cc57`  
**REGISTRO:** a implementação original foi objeto de correção de autorização na Execução 04B. A aprovação formal registrada para este conjunto refere-se à Execução 04B e ao commit indicado abaixo.  
**INFRAESTRUTURA EXTERNA:** não conectada.

### Execução 04B — Correção de autorização
**STATUS:** APROVADA FORMALMENTE PELO CTO  
**COMMIT APROVADO:** `9153602f6fd3d4defe3a639b34bd5e2c7f9c27d7`  
**PARENT:** `f71d668c845a1a5cbfb5c396ff752d0eeca6cc57`  
**OBJETIVO:** impedir que contextos de tenant atribuam papéis de escopo platform e exigir autorização explícita `role.assign.platform`, além da autorização genérica.  
**VALIDAÇÃO CI:** CONCLUÍDA COM SUCESSO  
**SHA EXECUTADO NO CI:** `c1953c8372ebbe517f5aa52b789595cbe956e29c`  
**GITHUB ACTIONS RUN #2:** https://github.com/gusborba9-star/Tysvora-Heal-OS/actions/runs/37858811970  
**EVIDÊNCIA:** o job `build-and-test` terminou com `completed / success`; `npm test` executou o build TypeScript e os testes de aplicação, autorização de papéis e Core.  
**INFRAESTRUTURA EXTERNA:** nenhuma conectada.

### Execução 05 — Core Configuration
**STATUS: APROVADA FORMALMENTE PELO CTO**  
**ESCOPO APROVADO:** configuração nos níveis tenant, organization, unit e module, com rejeição explícita de platform nesta execução.  
**COMMIT DE IMPLEMENTAÇÃO DA CORREÇÃO FINAL:** `2254ec1a7f4859ff636bb47385c68412834494e2`  
**COMMIT DOS TESTES DE REGRESSÃO / SHA FINAL VALIDADO:** `eadbf89fff0ebe22f3797bbf0191f15f7be002f1`  
**VALIDAÇÃO CI:** CONCLUÍDA COM SUCESSO — `completed / success`  
**GITHUB ACTIONS:** https://github.com/gusborba9-star/Tysvora-Heal-OS/actions/runs/37864216324  
**EVIDÊNCIA:** o job `build-and-test` e as etapas de instalação de dependências, build TypeScript e suíte completa de testes terminaram com sucesso no workflow indicado.  
**REGISTRO DOCUMENTAL NA BRANCH DE VALIDAÇÃO:** `eeb57e7ca2e689254821d3870c6bb9344d79bf8b` — https://github.com/gusborba9-star/Tysvora-Heal-OS/commit/eeb57e7ca2e689254821d3870c6bb9344d79bf8b  
**PRESERVAÇÃO:** histórico anterior preservado; Blueprint e código não alterados por este registro documental; nenhuma infraestrutura externa conectada.  
**FASE 3:** permanece **EM EXECUÇÃO** até que todas as capacidades previstas sejam implementadas e aprovadas formalmente. A aprovação da Execução 05 não encerra a Fase 3.

## FASE 4 — MODULE REGISTRY
**STATUS: NÃO INICIADA**

**Objetivo:** governar registro, disponibilidade, dependências e estado dos módulos.  
**Dependências:** FASE 3.  
**Conclusão:** módulos governados de forma controlada e auditável.

## FASE 5 — IDENTITY / SECURITY / LGPD
**STATUS: NÃO INICIADA**

**Objetivo:** consolidar identidade, autorização, segurança e privacidade.  
**Dependências:** FASES 2–4.  
**Conclusão:** controles validados nos cenários autorizados.

## FASE 6 — ENGINES REUTILIZÁVEIS
**STATUS: NÃO INICIADA**

**Objetivo:** criar capacidades reutilizáveis entre módulos.  
**Dependências:** FASES 2–5.  
**Conclusão:** capacidades reutilizáveis validadas.

## FASE 7 — CLINICAL INTELLIGENCE
**STATUS: NÃO INICIADA**

**Objetivo:** implementar apoio à decisão profissional sob governança.  
**Dependências:** FASES 3, 5 e 6.  
**Conclusão:** camada validada como apoio, sem autoridade clínica autônoma.

## FASE 8 — SENTINELA
**STATUS: NÃO INICIADA**

**Objetivo:** observação, detecção e alertas.  
**Dependências:** FASES 3, 5, 6 e, quando aplicável, 7.  
**Conclusão:** Sentinela validada e observável.

## FASE 9 — PRIMEIRO MÓDULO VERTICAL
**STATUS: NÃO INICIADA**

**Objetivo:** validar o primeiro módulo sobre o Core.  
**Dependências:** FASES 3–8 conforme o módulo.  
**Conclusão:** módulo validado sem duplicação do Core.

## FASE 10 — INTEGRAÇÕES
**STATUS: NÃO INICIADA**

**Objetivo:** estabelecer integrações externas por Integration Gateway e adapters.  
**Dependências:** FASES 2–5 e primeiro módulo.  
**Conclusão:** integrações homologadas.

## FASE 11 — AI GATEWAY
**STATUS: NÃO INICIADA**

**Objetivo:** camada governada e substituível para IA.  
**Dependências:** FASES 2, 5, 6 e 7.  
**Conclusão:** IA acessível sem acoplamento estrutural a um único provedor.

## FASE 12 — ANALYTICS / GESTÃO
**STATUS: NÃO INICIADA**

**Objetivo:** análise e gestão sobre dados e eventos autorizados.  
**Dependências:** Core, segurança, engines, integrações e módulos.  
**Conclusão:** capacidades validadas.

## FASE 13 — DEPLOYMENT CENTER
**STATUS: NÃO INICIADA**

**Objetivo:** distribuição e implantação versionada e reproduzível.  
**Dependências:** FASES 2–5 e maturidade operacional.  
**Conclusão:** versão autorizada preparada para implantação sem secrets nos artefatos.

## FASE 14 — HOMOLOGAÇÃO
**STATUS: NÃO INICIADA**

**Objetivo:** validar ambientes e cenários de aceitação.  
**Dependências:** escopo de produto e infraestrutura necessário.  
**Conclusão:** aprovação formal para produção.

## FASE 15 — PRODUÇÃO
**STATUS: NÃO INICIADA**

**Objetivo:** disponibilizar versão autorizada em produção.  
**Dependências:** FASE 14.  
**Conclusão:** operação estável dentro dos critérios definidos.

## FASE 16 — EXPANSÃO
**STATUS: NÃO INICIADA**

**Objetivo:** ampliar módulos, integrações, organizações e capacidades preservando arquitetura e governança.  
**Dependências:** produção estável e autorização de evolução.  
**Conclusão:** cada expansão possui escopo, validação, versionamento e governança próprios.

## Governança do roadmap

O roadmap é macro e não autoriza sozinho uma implementação. Cada avanço exige execução explícita do CTO, respeitando Blueprint, fase e dependências.

A FASE 3 permanece **EM EXECUÇÃO** até que as capacidades previstas sejam implementadas e aprovadas formalmente. Nenhuma fase posterior é autorizada por este documento.
