# Architecture Decision Record Register

**Status:** baseline de decisões revisado para fechamento da Fase 2A. ADRs continuam abertos até decisão formal documentada; isso não impede a conclusão documental da Fase 2A.  
**Formato:** cada ADR deve conter contexto, opções, decisão, justificativa, consequências, riscos, segurança/privacidade, migração e evidência.  
**Regra:** não transformar preferência técnica em decisão aprovada sem aceite explícito.

| ADR | Tema | Estado | Gate e dependência |
|---|---|---|---|
| ADR-001 | Topologia de implantação: monólito modular, serviços ou híbrido | ABERTO — DEFERÍVEL | decidir por blast radius, escala, custo e operação; antes de decomposição em serviços |
| ADR-002 | Broker, outbox/inbox e garantias de eventos | ABERTO — BLOQUEIA F6 PRODUTIVA | antes de eventos críticos assíncronos; contrato conceitual pode ser especificado antes |
| ADR-003 | Persistência, schemas, ownership e estratégia de migração | ABERTO — BLOQUEIA MIGRAÇÕES F3 | preservar Core e isolamento tenant; fechar antes de persistência/migrações novas |
| ADR-004 | Identidade de CareSubject, matching e resolução de duplicidade | ABERTO — BLOQUEIA MATCHING AUTOMÁTICO | bloqueia vinculação automática e ingestão clínica reconciliada; exige política de evidência, confiança, revisão e desfazimento |
| ADR-005 | Autorização contextual, purpose limitation e break-glass | ABERTO — BLOQUEIA DADOS REAIS | critérios verificáveis antes de dados reais em novos engines/conectores |
| ADR-006 | Consentimento, bases legais, retenção e direitos do titular | ABERTO — BLOQUEIA PRODUÇÃO COM DADOS PESSOAIS | revisão jurídica/encarregado por jurisdição e finalidade; consentimento não é base universal |
| ADR-007 | Repositório documental, integridade, assinatura e verificação | ABERTO — BLOQUEIA DOCUMENTO REGULADO | necessário antes de emitir/armazenar ordens e prescrições como documentos válidos |
| ADR-008 | Estratégia UIP: conectores, agente local, credenciais e atualização | ABERTO — BLOQUEIA CONECTOR PRODUTIVO | threat model, ciclo de atualização e conector de referência |
| ADR-009 | FHIR/RNDS: perfis, recursos, terminologias e homologação | ABERTO — POR INTEGRAÇÃO | decidir por caso de uso, perfil e contrato institucional; não bloqueia UIP genérico |
| ADR-010 | Busca, indexação e projeções de Care Context | ABERTO — DEFERÍVEL | fechar antes de indexar dados sensíveis ou escalar projeções |
| ADR-011 | Analytics store, lineage e segregação analítica | ABERTO — DEFERÍVEL | após métricas, volume e finalidade definidos; antes de analytics sensível em escala |
| ADR-012 | Operação offline, sincronização e proteção do dispositivo | ABERTO — BLOQUEIA OFFLINE | threat model específico para Field; experiência online pode ser construída sem offline |
| ADR-013 | SLO, HA, backup, RPO/RTO e recuperação | ABERTO — BLOQUEIA PRODUÇÃO | antes de produção e homologação operacional final |
| ADR-014 | AI Gateway: provedores, retenção, avaliação e roteamento | ABERTO — DEFERÍVEL | antes de habilitar IA com dados reais; IA é opcional |
| ADR-015 | Escopo regulatório, assinatura e prescrição eletrônica no Brasil | ABERTO — BLOQUEIA PRESCRIÇÃO PRODUTIVA | parecer jurídico/técnico e validação dos requisitos vigentes antes de emissão válida |
| ADR-016 | Estratégia de tenancy e fronteiras Organization/Unit/Program | ABERTO — BLOQUEIA F5 | compatibilidade com Core atual, modelo de acesso e testes negativos |
| ADR-017 | Modelo de comunicação, canais, entrega e contingência | ABERTO — BLOQUEIA CANAL PRODUTIVO | separar mensagem, notificação e ocorrência; definir SLA, contingência e confirmação |
| ADR-018 | Modelo de programa configurável e linguagem declarativa segura | ABERTO — BLOQUEIA F7 | limites entre configuração, protocolo e código; validação e sandbox de configuração |
| ADR-019 | Separação Control Center, Institutional Workspace e experiências | ABERTO — BLOQUEIA ADMIN PRIVILEGIADA | fronteira entre superadmin Tysvora e administrador institucional; metadados vs conteúdo clínico; suporte excepcional, break-glass, auditoria e segregação |
| ADR-020 | Easy Connect self-service e Connector Agent | ABERTO — BLOQUEIA AGENTE PRODUTIVO | threat model, pareamento, identidade de máquina, canal outbound, atualização assinada, credenciais locais, comandos allowlisted, revogação e UX de homologação |

## Ordem sugerida

1. ADR-003, ADR-004, ADR-005 e ADR-016: domínio, persistência e segurança fundamentais.
2. ADR-002, ADR-008 e ADR-017: eventos, integração e comunicação.
3. ADR-007 e ADR-015: documentos e assinatura regulada.
4. ADR-006, ADR-012 e ADR-013: governança legal e operação.
5. ADR-001, ADR-010 e ADR-011: topologia, busca e analytics.
6. ADR-019 e ADR-020: fronteiras administrativas, self-service e agente local.
7. ADR-014 e ADR-018: IA e configuração declarativa avançada.

A ordem é uma proposta de decisão documental; não autoriza implementação. ADRs podem ser reordenados se dependências forem registradas.
