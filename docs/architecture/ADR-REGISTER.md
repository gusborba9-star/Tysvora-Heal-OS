# Architecture Decision Record Register

**Status:** registro inicial; decisões não aprovadas permanecem abertas.  
**Formato:** cada ADR deve conter contexto, opções, decisão, justificativa, consequências, riscos, segurança/privacidade, migração e evidência.  
**Regra:** não transformar preferência técnica em decisão aprovada sem aceite explícito.

| ADR | Tema | Estado | Dependência/observação |
|---|---|---|---|
| ADR-001 | Topologia de implantação: monólito modular, serviços ou híbrido | ABERTO | decidir por blast radius, escala, custo e operação |
| ADR-002 | Broker, outbox/inbox e garantias de eventos | ABERTO | antes de eventos críticos assíncronos em produção |
| ADR-003 | Persistência, schemas, ownership e estratégia de migração | ABERTO | preservar Core e isolamento tenant |
| ADR-004 | Identidade de CareSubject, matching e resolução de duplicidade | ABERTO | bloqueia matching automático e integração clínica segura |
| ADR-005 | Autorização contextual, purpose limitation e break-glass | ABERTO | critérios verificáveis antes de dados reais |
| ADR-006 | Consentimento, bases legais, retenção e direitos do titular | ABERTO | revisão jurídica/encarregado por jurisdição e finalidade |
| ADR-007 | Repositório documental, integridade, assinatura e verificação | ABERTO | necessário para ordens e prescrições juridicamente válidas |
| ADR-008 | Estratégia UIP: conectores, agente local, credenciais e atualização | ABERTO | threat model e conector de referência |
| ADR-009 | FHIR/RNDS: perfis, recursos, terminologias e homologação | ABERTO | decidir por caso de uso e contrato institucional |
| ADR-010 | Busca, indexação e projeções de Care Context | ABERTO | não replicar conteúdo sensível indiscriminadamente |
| ADR-011 | Analytics store, lineage e segregação analítica | ABERTO | após métricas e volumes definidos |
| ADR-012 | Operação offline, sincronização e proteção do dispositivo | ABERTO | threat model específico para Field |
| ADR-013 | SLO, HA, backup, RPO/RTO e recuperação | ABERTO | antes de produção |
| ADR-014 | AI Gateway: provedores, retenção, avaliação e roteamento | ABERTO | IA é opcional e subordinada a policy |
| ADR-015 | Escopo regulatório, assinatura e prescrição eletrônica no Brasil | ABERTO | parecer jurídico/técnico e validação de requisitos vigentes |
| ADR-016 | Estratégia de tenancy e fronteiras Organization/Unit/Program | ABERTO | compatibilidade com Core atual e testes negativos |
| ADR-017 | Modelo de comunicação, canais, entrega e contingência | ABERTO | separar mensagem, notificação e ocorrência |
| ADR-018 | Modelo de programa configurável e linguagem declarativa segura | ABERTO | limites entre configuração, protocolo e código |

## Ordem sugerida

1. ADR-003, ADR-004, ADR-005 e ADR-016: domínio, persistência e segurança fundamentais.
2. ADR-002, ADR-008 e ADR-017: eventos, integração e comunicação.
3. ADR-007 e ADR-015: documentos e assinatura regulada.
4. ADR-006, ADR-012 e ADR-013: governança legal e operação.
5. ADR-001, ADR-010 e ADR-011: topologia, busca e analytics.
6. ADR-014 e ADR-018: IA e configuração declarativa avançada.

A ordem é uma proposta de decisão documental; não autoriza implementação. ADRs podem ser reordenados se dependências forem registradas.
