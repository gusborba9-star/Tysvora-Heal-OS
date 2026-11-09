# Tysvora Heal OS — Architecture

**Status:** especificação arquitetural; decisões pendentes identificadas. Não é evidência de implementação.

## 1. Princípio

Uma plataforma lógica única, composta por capacidades compartilhadas, domínios delimitados e experiências específicas. Módulos não duplicam Core. Motores são fronteiras de responsabilidade, não uma decisão antecipada por microserviços.

## 2. Camadas

1. Universal Core: tenancy, identidade, organização, unidades, profissionais, relações, autorização, configuração, auditoria e eventos.
2. Universal Data & Integration: conectores, ingestão, normalização, qualidade, proveniência, reconciliação e sincronização.
3. Domain Adaptation: vertical, especialidade, programa, linha de cuidado, protocolo, terminologia e extensões.
4. Care/Service Operations: jornadas, planos, intake, workflow, tarefas, comunicação, acompanhamento, campo e coordenação.
5. Intelligence: Sentinela, analytics, capacity optimization e IA governada.
6. Experience/Delivery: Institution, Patient, Field, APIs, administração, release e operação.

Segurança, observabilidade, governança e auditabilidade são transversais.

## 3. Estrutura lógica

```
apps/          Institution, Patient, Field, admin
packages/      Core, domain contracts, shared engines
modules/       bounded domain capabilities
connectors/    adapters and integration contracts
services/      independently deployed components when justified
infra/         runtime and operational configuration
docs/          governance and specifications
```

É uma organização lógica proposta, não obrigação imediata de refatoração. Monorepo e deploy topology devem ser avaliados com base em build isolation, blast radius, custo e escala.

## 4. Stack e portabilidade

A documentação anterior registra TypeScript, React, Next.js, PostgreSQL, Supabase, Vercel, OpenRouter e GitHub como escolhas/avaliações técnicas. Manter domínio independente de framework e fornecedor. PostgreSQL permanece âncora relacional; Supabase/Vercel são plataformas operacionais substituíveis. OpenRouter é opcional e acessado apenas via AI Gateway.

## 5. Heal Core — fronteira alvo e estado comprovado

**Fronteira alvo do Core:** identidade, tenancy, organizações, unidades, contexto de requisição, autorização transversal, configuração, auditoria e contratos fundamentais de eventos. O Core pode oferecer ports e contratos para capacidades transversais, mas não deve absorver regras de domínio de programas, clínica, integração ou operação.

**Estado comprovado no repositório:** consultar `docs/core/CORE-FOUNDATION.md` e `docs/core/APPLICATION-LAYER.md`. A fundação histórica implementa contratos de domínio, contexto, RBAC básico, configuração contextual, contratos de auditoria/eventos e abstrações de repositório/identidade, com implementações em memória para testes. Não implementa persistência real, RLS, provedor externo de autenticação, broker, Module Registry, UIP, workflow produtivo, notificações externas, documentos, engines clínicos, Sentinela, IA ou deployment.

**Capacidades da plataforma que não devem ser confundidas com o Core já entregue:** notification orchestration, workflow/task, document metadata, integration registry, observability operacional e module governance são capacidades/contratos de plataforma a construir nas fases correspondentes. Não declarar como implementadas por constarem nesta arquitetura.

Core não incorpora protocolos clínicos, regras de especialidade ou fluxos específicos de programa. CareSubject pode ser referenciado pelo Core para identidade/relacionamento, mantendo semântica clínica em bounded contexts.

## 6. Motores e fronteiras

- Program Engine: templates, versões, elegibilidade, enrollment, etapas, metas, indicadores e encerramento.
- Care Context: contexto longitudinal autorizado e fontes.
- UIP: conectores e ciclo de dados.
- Care Continuity: jornadas, planos, manifestações e reavaliações.
- Workflow/Task: execução e atribuição.
- Engagement: comunicação com usuário/paciente.
- Field Operations: visitas e trabalho externo.
- Clinical Governance: protocolos, instrumentos, ordens e documentos.
- Sentinela/Analytics: detecção e mensuração.
- AI Gateway: tarefas de IA governadas.

## 7. Experiências

Institution, Patient e Field compartilham identidade e contratos, mas não privilégios. Um usuário pode acumular papéis diferentes. A troca de contexto institucional deve ser explícita e visível.

## 8. Multi-tenancy e multi-instituição

Tenant é fronteira de isolamento do cliente. Organization e Unit representam estrutura organizacional. Relações assistenciais e inscrições em programas definem acesso contextual; não concedem acesso global ao histórico. A mesma pessoa pode ter vínculos múltiplos, segregados por padrão.

## 9. Integrações

Toda comunicação externa passa por adapters e contratos versionados. Domínio não chama diretamente fornecedor. UIP deve tratar autenticação, throttling, retries, idempotência, checkpoints, mapeamento, proveniência, dead-letter/reprocessamento e observabilidade.

## 10. Qualidades não funcionais

Segurança, privacidade, disponibilidade, integridade, acessibilidade, desempenho, portabilidade, auditabilidade, recuperação, interoperabilidade, extensibilidade e custo operacional. Metas quantitativas serão ADRs por contexto e volume.

## 11. Decisões pendentes

Topologia de serviços, broker, busca, armazenamento de documentos, analytics store, conectores prioritários, offline, HA, RPO/RTO, mecanismo de assinatura e deployment municipal. Resolver por ADR antes do uso produtivo.
