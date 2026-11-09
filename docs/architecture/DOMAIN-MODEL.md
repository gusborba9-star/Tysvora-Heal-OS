# Tysvora Heal OS — Universal Domain Model

**Escopo:** modelo conceitual; não define tabelas SQL nem autoriza migração.

## 1. Princípios

- identidade de acesso não é identidade assistencial;
- pessoa natural e sujeito que recebe cuidado são conceitos distintos;
- sujeito pode ser humano ou animal;
- programas, jornadas, protocolos e módulos são entidades diferentes;
- dado importado mantém origem e semântica;
- relações e inscrições limitam acesso;
- históricos clínicos e operacionais são versionados e não sobrescritos silenciosamente.

## 2. Entidades centrais

| Entidade | Responsabilidade |
|---|---|
| Tenant | fronteira de isolamento do cliente |
| Organization / Unit / Team | estrutura institucional e equipe |
| Person | pessoa natural |
| UserIdentity | credencial/identidade de acesso |
| Professional | qualificação, vínculo e escopo profissional |
| CareSubject | entidade que recebe cuidado; humano ou animal |
| Guardian | pessoa autorizada a representar CareSubject |
| CareRelationship | relação de cuidado entre sujeito, organização e responsáveis |
| InstitutionalMembership | vínculo de acesso institucional |
| ConsentRecord | registro de consentimento quando aplicável; não substitui base legal |
| VerticalDefinition | domínio configurável de atuação |
| SpecialtyDefinition | especialidade/campo profissional |
| ProgramDefinition | definição lógica de programa |
| ProgramVersion | versão imutável de configuração aprovada |
| ProgramEnrollment | inscrição de um CareSubject em uma versão/programa |
| CarePathway | jornada de cuidado/serviço |
| PathwayStage | etapa e transição de jornada |
| Protocol / ProtocolVersion | protocolo versionado e governado |
| Encounter | atendimento/contato assistencial |
| CarePlan / CarePlanVersion | plano e suas versões |
| CareEvent | manifestação ou ocorrência tipada |
| CareTask | trabalho atribuído e rastreável |
| CareOrder | ordem profissional; inclui prescrições quando aplicável |
| ClinicalDocument | documento clínico com integridade, assinatura/status |
| Assessment | avaliação/instrumento com versão e autoria |
| SourceRecord | registro externo ou origem de dado |
| ExternalIdentifier | identificador por sistema e domínio |
| DataLineage | transformações e proveniência |
| Workflow | processo e estado de execução |
| Notification | intenção e estado de entrega |
| IntegrationConnection | conexão e configuração segura |
| AuditEntry | ação governada e autoria |

## 3. Relações

- Person pode possuir UserIdentity, ser Professional, Guardian e/ou CareSubject humano, conforme regras.
- CareSubject pode ser associado a Guardian(s), incluindo animal e tutor.
- CareSubject pode possuir múltiplos CareRelationships, sem acesso cruzado automático.
- ProgramDefinition possui ProgramVersions; ProgramEnrollment aponta para versão específica e preserva histórico.
- Enrollment pode estar associado a CarePathway, CarePlan, equipe, unidade e Encounter.
- ProtocolVersion pode ser referenciado por uma jornada, plano ou decisão, preservando a versão aplicada.
- CareEvent pode originar CareTask, mas relato não equivale a diagnóstico.
- CareOrder e ClinicalDocument preservam autoria, status e validade.
- SourceRecord e DataLineage acompanham qualquer dado integrado relevante.

## 4. Estados e versionamento

ProgramVersion e ProtocolVersion são imutáveis após aprovação/publicação. Mudanças criam nova versão e definem vigência. Inscrições existentes seguem política explícita de migração/adoção. CarePlanVersion e documentos não são sobrescritos; substituição mantém trilha e estado do anterior.

## 5. Fronteiras

Core controla identidade, tenancy, organização, autorização e auditoria. Domínios de cuidado controlam semântica de atendimento, programa, protocolo e documento. Analytics recebe dados minimizados e autorizados. Integrações não são fonte de autoridade por padrão; autoridade de cada campo depende de política.

## 6. Invariantes a testar

- nenhum relacionamento permite atravessar tenant sem autorização explícita;
- usuário não é automaticamente CareSubject;
- Guardian não recebe acesso além do escopo delegado;
- inscrição em programa não concede prontuário irrestrito;
- versão aplicada é recuperável;
- cada dado integrado identifica origem e transformação;
- eventos/tarefas são idempotentes;
- encerramento não apaga histórico.
