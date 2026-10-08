# Tysvora Heal OS — Roadmap

**Status:** Roadmap macro inicial.

Cada fase depende de validação da anterior; sua presença não significa implementação.

## FASE 0 — GOVERNANÇA
**Objetivo:** estabelecer autoridade documental, regras de execução, versionamento e decisão.  
**Entregáveis:** governança; hierarquia documental; regras de alteração e validação.  
**Dependências:** nenhuma.  
**Conclusão:** governança aprovada e adotada.

## FASE 1 — FUNDAÇÃO
**Objetivo:** estabelecer a base documental controlada.  
**Entregáveis:** README, Blueprint, Roadmap, visão, princípios e fases.  
**Dependências:** FASE 0.  
**Conclusão:** documentação revisada e consistente, sem produto.

## FASE 2 — ARQUITETURA TÉCNICA
**Objetivo:** transformar a arquitetura conceitual em decisões técnicas verificáveis.  
**Entregáveis:** stack, persistência, tenancy, contratos, infraestrutura e deployment.  
**Dependências:** FASE 1.  
**Conclusão:** arquitetura técnica aprovada pelo CTO.

## FASE 3 — HEAL CORE
**Objetivo:** implementar capacidades transversais.  
**Entregáveis:** Core, organizações, unidades, usuários, configuração, eventos, auditoria, workflows e notificações autorizados.  
**Dependências:** FASE 2.  
**Conclusão:** Core validado.

## FASE 4 — MODULE REGISTRY
**Objetivo:** governar registro, disponibilidade, dependências e estado dos módulos.  
**Entregáveis:** registry, metadados, dependências, ciclo de vida e ativação/desativação.  
**Dependências:** FASE 3.  
**Conclusão:** módulos governados de forma controlada e auditável.

## FASE 5 — IDENTITY / SECURITY / LGPD
**Objetivo:** consolidar identidade, autorização, segurança e privacidade.  
**Entregáveis:** identidade, RBAC, least privilege, segregação, auditoria, privacidade e proteção de secrets/dados.  
**Dependências:** FASES 2–4.  
**Conclusão:** controles validados nos cenários autorizados.

## FASE 6 — ENGINES REUTILIZÁVEIS
**Objetivo:** criar capacidades reutilizáveis entre módulos.  
**Entregáveis:** engines, contratos reutilizáveis e mecanismos determinísticos.  
**Dependências:** FASES 2–5.  
**Conclusão:** capacidades reutilizáveis validadas.

## FASE 7 — CLINICAL INTELLIGENCE
**Objetivo:** implementar apoio à decisão profissional sob governança.  
**Entregáveis:** Evidence, Calculation, Protocol, Safety e AI Engines; avaliação do Veritas-OS por REUTILIZAR/ADAPTAR/DESCARTAR/RECONSTRUIR.  
**Dependências:** FASES 3, 5 e 6.  
**Conclusão:** camada validada como apoio, sem autoridade clínica autônoma.

## FASE 8 — SENTINELA
**Objetivo:** observação, detecção e alertas.  
**Entregáveis:** observação de eventos/indicadores, regras, alertas e rastreabilidade.  
**Dependências:** FASES 3, 5, 6 e, quando aplicável, 7.  
**Conclusão:** Sentinela validada e observável.

## FASE 9 — PRIMEIRO MÓDULO VERTICAL
**Objetivo:** validar o primeiro módulo sobre o Core.  
**Entregáveis:** módulo aprovado, integração, tenancy, permissões e ciclo de ativação.  
**Dependências:** FASES 3–8 conforme o módulo.  
**Conclusão:** módulo validado sem duplicação do Core.

## FASE 10 — INTEGRAÇÕES
**Objetivo:** estabelecer integrações externas por Integration Gateway e adapters.  
**Entregáveis:** gateway, adapters, contratos, observabilidade e auditoria.  
**Dependências:** FASES 2–5 e primeiro módulo.  
**Conclusão:** integrações homologadas.

## FASE 11 — AI GATEWAY
**Objetivo:** camada governada e substituível para IA.  
**Entregáveis:** gateway, abstração de provedores, governança de contexto, custos e utilização.  
**Dependências:** FASES 2, 5, 6 e 7.  
**Conclusão:** IA acessível sem acoplamento estrutural a um único provedor.

## FASE 12 — ANALYTICS / GESTÃO
**Objetivo:** análise e gestão sobre dados e eventos autorizados.  
**Entregáveis:** indicadores, analytics, gestão e visualizações conforme especificação posterior.  
**Dependências:** Core, segurança, engines, integrações e módulos.  
**Conclusão:** capacidades validadas.

## FASE 13 — DEPLOYMENT CENTER
**Objetivo:** distribuição e implantação versionada e reproduzível.  
**Entregáveis:** versões, artefatos, pacotes, homologação, deploy e rollback.  
**Dependências:** FASES 2–5 e maturidade operacional.  
**Conclusão:** versão autorizada preparada para implantação sem secrets nos artefatos.

## FASE 14 — HOMOLOGAÇÃO
**Objetivo:** validar ambientes e cenários de aceitação.  
**Entregáveis:** critérios, testes, evidências e validações de segurança, integração e operação.  
**Dependências:** escopo de produto e infraestrutura necessário.  
**Conclusão:** aprovação formal para produção.

## FASE 15 — PRODUÇÃO
**Objetivo:** disponibilizar versão autorizada em produção.  
**Entregáveis:** release, observabilidade, controles, rollback e monitoramento pós-release.  
**Dependências:** FASE 14.  
**Conclusão:** operação estável dentro dos critérios definidos.

## FASE 16 — EXPANSÃO
**Objetivo:** ampliar módulos, integrações, organizações e capacidades preservando arquitetura e governança.  
**Entregáveis:** novos módulos, integrações, engines, tenants e evoluções aprovadas.  
**Dependências:** produção estável e autorização de evolução.  
**Conclusão:** cada expansão possui escopo, validação, versionamento e governança próprios.

## Governança do roadmap

O roadmap é macro e não autoriza sozinho uma implementação. Cada avanço exige execução explícita do CTO, respeitando Blueprint, fase e dependências.