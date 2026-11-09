# Tysvora Heal OS — Blueprint 2.0

**Status:** Proposta arquitetural consolidada para aprovação do CTO.  
**Natureza:** normativa para visão e arquitetura; não comprova implementação.  
**Regra:** este documento não autoriza alteração de código, banco, infraestrutura ou produção.

## 1. Identidade e posicionamento

**Tysvora Systems** é a identidade organizacional do ecossistema.  
**Tysvora Heal OS** é uma plataforma universal de cuidado, programas e continuidade.

**Categoria:** Universal Care, Program & Continuity Platform.

**Tese:** o cuidado não termina quando o paciente sai da instituição; tampouco deve ficar preso ao sistema em que foi registrado.

O Tysvora conecta organizações, profissionais, pessoas, sujeitos de cuidado, programas, jornadas, dados e operações. Atua como infraestrutura de coordenação e continuidade sobre sistemas existentes, sem exigir sua substituição. Pode também atender organizações sem sistema adequado.

## 2. Objetivo do produto

Permitir que qualquer organização configure e opere verticais, especialidades, programas e linhas de cuidado sobre uma infraestrutura comum, preservando regras e responsabilidades específicas de cada domínio.

A plataforma deve:
- conectar o cuidado realizado, o profissional responsável e a pessoa acompanhada;
- receber manifestações e dados de múltiplas origens;
- reconstruir contexto relevante com fonte, autoria e atualização;
- transformar eventos em trabalho profissional e operacional;
- acompanhar planos, programas, tarefas, resultados e reavaliações;
- coordenar operações presenciais, remotas e de campo;
- oferecer inteligência operacional e analítica governada;
- integrar-se a sistemas externos sem acoplamento a um fornecedor.

## 3. Problemas que resolve

- Fragmentação de dados e sistemas;
- perda de continuidade após consultas e atendimentos;
- dificuldade de identificar quem deve agir e quando;
- comunicação sem contexto clínico ou operacional;
- programas isolados e pouco mensuráveis;
- reconstrução manual de histórico;
- encaminhamentos, retornos e visitas sem coordenação;
- baixa visibilidade de filas, capacidade e pendências;
- integrações frágeis, proprietárias ou inexistentes.

## 4. Conceitos que não podem ser confundidos

| Conceito | Definição |
|---|---|
| Vertical | Domínio de atuação, como saúde pública, clínica privada ou veterinária |
| Especialidade | Campo profissional ou técnico, como cardiologia, nutrição ou psicologia |
| Programa | Iniciativa estruturada com público, elegibilidade, objetivos, jornada, equipe e indicadores |
| Linha de cuidado | Articulação de serviços e profissionais ao longo do percurso |
| Protocolo | Regras e recomendações técnico-profissionais versionadas e governadas |
| Módulo | Pacote de software que entrega capacidades de domínio |
| Configuração | Parâmetros e composição de capacidades existentes |
| Jornada | Percurso individual de cuidado ou serviço ao longo do tempo |

Programa não é sinônimo de módulo. Especialidade não é sinônimo de vertical. Protocolo não é uma decisão autônoma do sistema.

## 5. Ambientes e domínios suportados

A arquitetura deverá comportar, sem catálogo fechado:
- SUS, secretarias, municípios, redes, hospitais, UBS e serviços públicos;
- clínicas, consultórios, redes privadas e profissionais independentes;
- medicina, enfermagem, nutrição, psicologia, psiquiatria, odontologia, fisioterapia e outras profissões;
- programas de tabagismo, diabetes, hipertensão, depressão, saúde mental, obesidade, pré-natal, reabilitação, saúde da criança, saúde do idoso, doenças infecciosas, cuidados paliativos e outros;
- saúde animal e serviços veterinários.

A presença de um domínio no Blueprint não significa que ele esteja implementado, homologado ou juridicamente autorizado.

## 6. Experiências de produto

As experiências são interfaces sobre a mesma plataforma, não produtos isolados:

1. **Tysvora Institution:** gestão institucional, equipes, programas, jornadas, contexto assistencial, comunicação, indicadores, configurações e integrações.
2. **Tysvora Patient:** uma identidade de acesso para múltiplos relacionamentos institucionais, com isolamento e permissões independentes.
3. **Tysvora Field:** execução externa, visitas, tarefas, agendas, rotas, evidências e encerramento.

Uma pessoa pode estar vinculada a várias instituições e programas. A interface deve deixar claro em qual contexto institucional o usuário está operando.

## 7. Princípios arquiteturais

- Core universal e independente de vertical;
- configuração sobre duplicação;
- extensões de domínio sem forks por cliente;
- contratos explícitos e versionados;
- interoperabilidade e substituição de fornecedores;
- proveniência e linhagem dos dados;
- isolamento multi-tenant e multi-institucional;
- segurança, privacidade e finalidade por design;
- menor privilégio e autorização contextual;
- auditabilidade de ações e decisões;
- resiliência, idempotência e recuperação;
- acessibilidade, experiência móvel e operação offline controlada quando necessária;
- observabilidade técnica, operacional e de negócio;
- IA substituível, governada e subordinada a regras determinísticas e autoridade profissional;
- evolução incremental com gates verificáveis.

## 8. Arquitetura em camadas

1. **Universal Core:** identidade, tenancy, organizações, unidades, profissionais, permissões, relacionamentos, configuração, auditoria, eventos e governança.
2. **Universal Data & Integration:** conectores, ingestão, validação, normalização, proveniência, reconciliação, interoperabilidade e sincronização.
3. **Domain Adaptation:** verticais, especialidades, programas, linhas de cuidado, protocolos, terminologias e regras específicas.
4. **Care & Service Operations:** jornadas, planos, intake, comunicação, tarefas, coordenação, visitas, acompanhamento e encerramento.
5. **Intelligence:** Sentinela, analytics, indicadores, capacity optimization e apoio à decisão.
6. **Experience & Delivery:** interfaces Institution, Patient e Field, APIs, deployment, configuração e operação.

Segurança, governança, observabilidade e auditoria atravessam todas as camadas.

## 9. Motores universais

- Identity & Access Engine;
- Organization & Relationship Engine;
- Care Context & Longitudinal Record Engine;
- Universal Integration & Data Adaptation Engine;
- Program Engine;
- Care Pathway & Continuity Engine;
- Care Intake & Triage Orchestration;
- Care Plan & Clinical Document Engine;
- Workflow & Task Engine;
- Patient Engagement & Communication Engine;
- Follow-up Engine;
- Field Operations Engine;
- Clinical Governance & Protocol Engine;
- Notification Engine;
- Sentinela & Intelligence Engine;
- Analytics & Capacity Optimization Engine;
- AI Gateway.

A separação em motores é conceitual e de responsabilidade; não exige microserviços independentes. A topologia de implantação será decidida por evidência de escala, segurança e operação.

## 10. Programas como capacidade de primeira classe

O Program Engine deve permitir modelar e operar programas sem criar um novo sistema ou módulo para cada programa.

Cada programa poderá declarar:
- identidade, finalidade, público e instituição responsável;
- elegibilidade, inclusão, exclusão e critérios de saída;
- template, versão, vigência e aprovação;
- etapas, estados, transições e prazos;
- equipe, papéis e responsabilidades;
- plano, metas, intervenções e avaliações;
- protocolos e instrumentos aplicáveis;
- tarefas, comunicação e escalonamentos;
- indicadores de processo, resultado e segurança;
- integrações, fontes de dados e requisitos de consentimento/base legal;
- regras de encerramento, transferência e reentrada.

Programas podem ser configurados por organização, rede, município ou unidade, dentro de limites de governança. Alterações de versão não devem reescrever inscrições e decisões históricas.

## 11. Modelo universal de domínio

Entidades conceituais centrais:
- Tenant, Organization, Unit, Team;
- Person, UserIdentity, Professional, CareSubject, Guardian;
- CareRelationship, InstitutionalMembership, ConsentRecord;
- VerticalDefinition, SpecialtyDefinition, ProgramDefinition, ProgramVersion, ProgramEnrollment;
- CarePathway, PathwayStage, Protocol, ProtocolVersion;
- Encounter, CarePlan, CarePlanVersion, CareEvent, CareTask;
- CareOrder, Prescription, ClinicalDocument, Assessment;
- SourceRecord, ExternalIdentifier, DataLineage;
- Workflow, Notification, IntegrationConnection, AuditEntry.

Person é a pessoa natural. CareSubject é quem recebe cuidado e pode ser humano ou animal. Guardian é a pessoa autorizada a representar um sujeito, quando aplicável. Identidade de login não é relacionamento assistencial. A modelagem definitiva deve preservar limites de domínio e evitar um prontuário universal monolítico.

## 12. Ciclo universal de cuidado/serviço

Origem e vínculo → contexto → atendimento/inscrição → plano/jornada → manifestações e acompanhamento → avaliação profissional → decisão → coordenação e execução → resultado → reavaliação, transferência ou encerramento.

O fluxo pode variar por vertical e programa. Nem toda interação é evento clínico; nem toda tarefa é decisão clínica.

Distinções obrigatórias: mensagem, relato, manifestação, sinal de risco, ocorrência, avaliação, decisão profissional, orientação, prescrição/ordem, tarefa, confirmação de recebimento, adesão autorrelatada, resultado medido e evolução profissional.

## 13. Contexto longitudinal e workspace profissional

O Unified Care Workspace apresenta apenas informação necessária à finalidade e ao profissional autorizado:
- identificação e vínculo;
- instituição, unidade, programa e equipe;
- histórico relevante com fonte e data;
- estado atual, manifestação e prioridade;
- plano, ordens e documentos vigentes;
- pendências e ações disponíveis.

Não é cópia integral de todos os prontuários. Deve preservar autoria, fonte, temporalidade, confiabilidade e limites de acesso.

## 14. Integração e interoperabilidade

O Universal Integration Platform (UIP) deve suportar:
- APIs, OAuth, webhooks e credenciais rotacionáveis;
- bancos externos com contas e permissões mínimas, somente leitura quando possível;
- arquivos CSV, XLSX, XML, JSON, OFX e documentos;
- agente local para redes e sistemas locais;
- padrões de saúde, incluindo HL7 FHIR R4 e RNDS quando aplicáveis e homologados;
- conectores específicos e importação assistida.

Integração não implica equivalência semântica. Cada dado deve manter origem, identificador externo, momento de origem/ingestão, transformação, versão do mapeamento, autoria, qualidade e estado de sincronização. Conflitos devem ser reconciliados segundo políticas explícitas, nunca por sobrescrita silenciosa.

## 15. Governança clínica e segurança

Tysvora organiza e transmite trabalho; não diagnostica nem prescreve autonomamente. Decisões clínicas permanecem com profissional habilitado, dentro do escopo legal e institucional.

Prescrições e documentos precisam de autoria, integridade, assinatura válida quando exigida, versionamento, status, justificativa e histórico não destrutivo. A plataforma não deve apresentar PDF visualmente semelhante como prescrição válida sem atender requisitos legais.

Acesso deve combinar RBAC, atributos/contexto, finalidade, vínculo, unidade, equipe, relação assistencial e necessidade. LGPD, sigilo profissional, normas setoriais e regras de retenção precisam ser avaliados por jurisdição e caso de uso.

## 16. Inteligência, Sentinela e IA

Sentinela observa sinais autorizados e identifica anomalias, atrasos, filas, risco operacional e oportunidades de ação. Deve explicar origem, regra, prioridade e destinatário; não transforma alertas em diagnóstico.

IA pode resumir, classificar, extrair, sugerir e apoiar tarefas aprovadas. Deve usar políticas, avaliação, proteção contra prompt injection, rastreabilidade, limites de dados, avaliação de vieses, fallback seguro e supervisão humana. Regras determinísticas, cálculos e protocolos permanecem separados.

## 17. Operações e capacidade

A plataforma deverá coordenar trabalho remoto, presencial e de campo. Otimização considera capacidade, competência, território, distância, agenda, carga, prioridade definida por profissional e restrições institucionais. A otimização financeira não pode sobrepor segurança ou adequação assistencial.

Indicadores devem medir tempo para recuperar contexto, primeira resposta, fila, tarefas vencidas, comparecimento, visitas concluídas, continuidade, adesão autorrelatada, resultados e carga profissional. Benefícios econômicos só serão alegados após pilotos medidos.

## 18. Modularidade e extensão

Módulos entregam capacidades de domínio e declaram manifestos, versões, dependências, permissões, dados, APIs, eventos, configuração, saúde e ciclo de vida. Programas e protocolos são configurações/artefatos governados; não devem ser confundidos com pacotes de código.

Novas verticais devem ser habilitadas por composição de Core + adaptadores + configurações + módulos de domínio quando necessário. Não prometer que toda vertical será apenas configuração: extensões reais podem exigir desenvolvimento.

## 19. Operação, implantação e comercialização

A plataforma deverá suportar onboarding progressivo, importação assistida, homologação, ambientes, release versionado, feature flags, configuração e observabilidade. O ideal é reduzir implantação, mas não prometer instalação universal em 15 minutos ou uma hora sem testes por fonte de dados.

Secrets não entram em pacotes. Isolamento de dados e responsabilidade operacional devem ser explícitos. Contratos comerciais não substituem autorização técnica nem homologação.

## 20. Benchmark competitivo e posicionamento

O mercado inclui plataformas de gestão populacional, prontuários, home care, coordenação de cuidado, comunicação paciente-UBS e interoperabilidade. Não afirmar ausência de concorrentes ou exclusividade sem demonstrações comparáveis.

Hipóteses de diferenciação a validar:
- camada horizontal e independente de fornecedor;
- vínculo de relato do paciente ao plano, encontro ou ordem exata;
- ciclo completo da manifestação à ação e ao resultado;
- programas configuráveis e combináveis;
- um app com relacionamentos institucionais segregados;
- workspace contextual multi-origem;
- coordenação integrada de campo e capacidade;
- implantação e extensibilidade com custo inferior.

## 21. Cenários de arquitetura obrigatórios

1. Nutrição: plano, dificuldade relatada, revisão profissional, nova versão e retorno.
2. Medicina: relato de persistência de dor, avaliação pelo médico, decisão, prescrição válida e histórico de versões.
3. UBS: recaída em programa, contexto consolidado, contato, visita domiciliar, execução e encerramento.
4. Programas simultâneos: uma pessoa em diabetes, hipertensão e tabagismo com equipes e acessos segregados.
5. Multi-instituição: paciente em clínica A e instituição B, com isolamento e compartilhamento autorizado.
6. Veterinária: CareSubject animal, Guardian humano, clínica e jornada específica.
7. Integração: divergência entre fonte externa e dado institucional, proveniência e reconciliação.
8. Operação de campo: priorização profissional, competência, território, atribuição e evidência de conclusão.

## 22. Governança documental

BLUEPRINT define o que o produto é e os princípios.  
ROADMAP define a ordem e os gates.  
Especificações definem contratos verificáveis.  
EXECUÇÕES autorizam escopo específico.  
Código é a implementação.

Documentos devem distinguir: implementado e evidenciado; em desenvolvimento; especificado; planejado; decisão pendente. Preservar histórico e IDs de fases/execuções.

## 23. Regra de ouro

Nenhuma otimização local pode comprometer a capacidade universal, a segurança, a interoperabilidade ou a evolução sustentável do Tysvora.

## 24. Decisões ainda abertas

Não presumir decisões definitivas sobre: stack futura além do que já está documentado, topologia de serviços, broker, FHIR/RNDS por integração, mecanismo de assinatura, identidade externa, armazenamento documental, analytics, RPO/RTO, operação offline, implantação municipal, modelo comercial e certificações. Cada decisão exige ADR, evidência e aprovação.
