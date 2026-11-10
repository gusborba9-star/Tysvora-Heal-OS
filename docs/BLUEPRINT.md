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

1. **Tysvora Institution — Institutional Workspace Premium:** painel central de operação e administração da instituição, dentro de seu escopo autorizado.
2. **Tysvora Professional:** workspace do profissional, com atribuições, contexto assistencial e ações sob sua responsabilidade.
3. **Tysvora Patient:** identidade de acesso para múltiplos relacionamentos institucionais segregados.
4. **Tysvora Field:** execução externa, visitas, tarefas, agendas, rotas, evidências e encerramento.
5. **Tysvora Control Center:** painel interno Tysvora para governança e operação da plataforma, sem acesso clínico global por padrão.

São superfícies distintas sobre o mesmo Core. O Institutional Workspace pertence à instituição; o Control Center pertence à Tysvora. Uma pessoa pode estar vinculada a várias instituições e programas. A interface deve deixar claro o contexto ativo.

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

A UIP deve suportar API, Database, File/Document, Secure Transfer, Healthcare Interoperability, Messaging, Local Connector Agent, Legacy/Proprietary Adapters e UI Automation como último recurso. Também deve aceitar upload, cadastro manual e fontes CRM/ERP. Easy Connect fornece onboarding self-service, discovery, mapping assistido, preview, aprovação e monitoramento. A instituição pode começar sem integração e evoluir progressivamente. O Connector Agent executa acesso local autorizado; o navegador apenas administra e configura. Contratos, manifests, adapters, mappings e schemas são versionados; dados mantêm origem, autoria, transformação, qualidade e lineage. Conflitos são reconciliados por política explícita, nunca por sobrescrita silenciosa.

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

 
## 25. Easy Connect, autoatendimento e integração progressiva

A UIP deve maximizar a abrangência tecnológica e minimizar a complexidade percebida pela instituição. A experiência Tysvora Easy Connect permite configurar, testar, homologar e monitorar integrações por autoatendimento, sem exigir consultoria técnica do Tysvora em cada implantação.

A instituição pode começar sem integração técnica e evoluir progressivamente: cadastro manual → upload/importação → conexão API/DB/CRM → Connector Agent → sincronização governada. Todos os caminhos convergem para os mesmos mecanismos de identidade, validação, proveniência, autorização e reconciliação.

Modalidades: API (REST, GraphQL, SOAP, OAuth/OIDC, webhooks); Database (PostgreSQL, MySQL, SQL Server, Oracle e outros drivers aprovados); File & Document (CSV, XLSX, XML, JSON, OFX, PDF e imagens); Secure Transfer (SFTP/FTPS); padrões de saúde (HL7 v2, FHIR R4, RNDS, TISS, DICOM conforme perfil e homologação); mensageria; adapters legados/proprietários; UI Automation como último recurso controlado; Universal Data Intake para upload, importação recorrente, cadastro manual e CRM/ERP/gestão.

O Tysvora Connector Agent é um runtime leve, opcional, baixado pelo painel e instalado em máquina/servidor autorizado. O navegador administra download, pareamento e configuração; não acessa arbitrariamente a rede local. O agente executa conectividade local, preferencialmente por conexões outbound autenticadas e criptografadas, com identidade própria, permissões mínimas, credenciais protegidas, pacotes assinados, allowlists, logs, atualização segura, suspensão e revogação remota. Não exige portas inbound como padrão.

A UIP separa Control Plane (registry, manifests, contracts, capabilities, credenciais, políticas, mappings, aprovações e lifecycle) de Data Plane (runtime, agente, discovery, extraction, ingestion, transformation, validation, reconciliation, sync e observability). Contratos, pacote, manifest, mapping e schema possuem versões independentes e compatibilidade declarada. Capability negotiation identifica capacidades reais da instância.

Upload e cadastro manual são capacidades de primeira classe. Importações exigem preview, validação, quarentena, sugestão de mapping, revisão humana, detecção de duplicidade, relatório de aceitos/rejeitados, autoria, timestamp e lineage. CRM/ERP podem fornecer dados relacionais e operacionais, mantendo separação de finalidade e permissões em relação a dados clínicos. Escrita externa exige capacidade explícita, autorização e interface oficial; escrita direta em tabelas externas não é padrão.

O pipeline preserva Source Data, Normalized Data e Canonical Domain Data, incluindo campos desconhecidos e proveniência. Inclui identity resolution governada, qualidade, autoridade por atributo, conflitos e reconciliação. Não aplicar sobrescrita silenciosa ou last-write-wins indiscriminado. Modos de sincronização incluem real-time, near-real-time, polling, batch, incremental, full reconciliation e on-demand, com checkpoints, idempotência, retry/backoff, dead-letter, replay auditado e observabilidade.

Universal significa arquitetura extensível por adapters e contratos, não compatibilidade automática com qualquer tecnologia futura nem necessidade de construir todos os conectores antecipadamente. Novas tecnologias podem exigir evolução localizada/versionada sem reconstruir o Universal Core.

## 26. Experiências de produto e painéis administrativos

As experiências operacionais são Patient, Professional, Institution e Field. Compartilham Core, identidade, domínio, APIs e eventos, mas possuem navegação, contexto e autorização distintos.

**Tysvora Institution — Institutional Workspace Premium:** painel central da instituição para administrar e operar organizações/unidades autorizadas, profissionais, pacientes vinculados, programas, jornadas, filas, manifestações, tarefas, comunicação, integrações, indicadores, configurações e governança local. Visão completa significa abrangência operacional dentro da instituição, finalidade e permissões do usuário; não acesso irrestrito a todo conteúdo clínico.

**Tysvora Professional:** workspace do profissional com agenda/atribuições, pacientes e sujeitos sob sua responsabilidade, contexto assistencial autorizado, manifestações, planos, documentos, decisões, ordens, tarefas, comunicação e acompanhamento. Não concede automaticamente privilégios administrativos institucionais.

**Tysvora Patient:** identidade de acesso para múltiplos relacionamentos institucionais segregados, com planos, orientações, mensagens, documentos, programas e manifestações. Compartilhamento entre instituições não ocorre por padrão.

**Tysvora Field:** experiência de execução externa com tarefas, visitas, agenda, território, rotas, formulários, evidências e encerramento, com acesso mínimo e proteção do dispositivo.

**Tysvora Control Center:** painel interno e privilegiado da operação Tysvora para governar tenants, organizações contratantes, planos/direitos, módulos, conectores homologados, versões, disponibilidade, suporte, incidentes, métricas técnicas, billing e políticas globais. Visão completa significa visão operacional e de governança da plataforma, não acesso irrestrito ao conteúdo clínico de todos os tenants. Acesso excepcional a dados de cliente exige finalidade, autorização, escopo mínimo, justificativa, duração limitada e auditoria, conforme base legal e contrato.

O Institutional Workspace Premium pertence à instituição e governa sua operação; o Control Center pertence à Tysvora e governa a plataforma. Nenhuma interface pode usar ocultação visual como substituto de autorização server-side.


## 27. Modos de operação: sistema principal e plataforma integrada

Tysvora deve operar em dois modos complementares, configuráveis por instituição e combináveis na mesma organização:

**Modo Primary System (sistema principal):** para clínicas, consultórios e instituições sem sistema adequado. Tysvora fornece o núcleo assistencial nativo necessário ao escopo contratado: cadastro e identidade de pacientes/sujeitos, profissionais e equipes, agenda/atendimentos conforme módulo, Encounter, evolução profissional, CarePlan, ordens, documentos clínicos, comunicação, acompanhamento, programas, tarefas, auditoria e indicadores.

**Modo Integrated Platform (plataforma integrada):** para organizações que mantêm prontuário, ERP ou sistemas especializados. Tysvora conecta fontes autorizadas, reconcilia contexto, coordena continuidade, comunicação e operações, sem exigir substituição do sistema de origem. Escrita de volta só ocorre por interface oficial, capability declarada e autorização explícita.

A instituição pode combinar os modos: manter faturamento ou prontuário especializado externo e utilizar o Clinical Record Core nativo para domínios ou fluxos não cobertos, desde que ownership, autoridade por atributo, fonte, sincronização e responsabilidade estejam definidos. Não pode haver dois registros concorrentes tratados como autoridade sem política explícita.

**Clinical Record Core** é uma capacidade nativa do produto, não um compromisso de substituir automaticamente todo EHR/ERP hospitalar. Seu escopo mínimo inclui identidade assistencial, vínculos, atendimentos, evoluções, planos, ordens, documentos, autoria, versionamento, integridade, permissões e trilha auditável. Funcionalidades fiscais, contábeis, folha, faturamento hospitalar ou especializadas só serão incluídas mediante escopo, ADR e validação próprios.

## 28. Comunicação bidirecional e documentos clínicos

Secure Care Messaging deve permitir comunicação entre paciente e profissionais autorizados, contextualizada por instituição, vínculo, programa, Encounter, CarePlan ou ocorrência quando aplicável. O chat suporta texto e anexos, com envio e recebimento, estado de entrega, notificações, histórico, busca/autorização, retenção e auditoria.

Tipos de anexos previstos: imagens, PDFs e documentos permitidos pela política institucional. Arquivos clínicos devem ser classificados como ClinicalDocument, não permanecer apenas como anexo opaco da conversa. Categorias incluem prescrição, atestado, laudo, resultado, solicitação de exame, encaminhamento, orientação profissional e documento administrativo.

Documentos clínicos devem preservar autoria, emissor, destinatário, data, integridade, versão, status, relação com Encounter/CarePlan e assinatura válida quando legalmente exigida. Uma nova versão não apaga nem sobrescreve silenciosamente a anterior. PDF visualmente semelhante não é, por si só, prescrição ou atestado legalmente válido.

O envio e recebimento de arquivos exige armazenamento privado, autorização contextual, limites de tipo/tamanho, verificação de malware, criptografia, URLs temporárias, trilha de acesso/download e políticas de retenção. Mensagens, relatos do paciente, orientações profissionais, decisões, prescrições e confirmações devem manter semântica distinta.

### Áudio como capacidade opcional governada

Áudio não faz parte do padrão inicial obrigatório do chat. A arquitetura pode prever suporte futuro a mensagens de áudio, mas o recurso deve nascer desabilitado por padrão e permanecer sob feature flag administrável no Tysvora Control Center. A disponibilização depende de habilitação comercial/técnica, política institucional, consentimento/transparência quando aplicável, limites de duração/tamanho, retenção, moderação/segurança, acessibilidade e medição de custos de armazenamento, tráfego e eventual transcrição/IA.

O Control Center controla disponibilidade global, elegibilidade por plano e ativação do recurso. O administrador institucional pode habilitar ou desabilitar o uso dentro da sua organização apenas quando a plataforma o disponibilizar e o contrato permitir. A desativação bloqueia novos envios, sem apagar mensagens/arquivos válidos já existentes nem eliminar obrigações de retenção. Não incluir transcrição automática no escopo básico; ela exige capacidade e custo separados.

## 29. Gestão do ciclo de vida do vínculo profissional-paciente

A plataforma deve distinguir identidade da pessoa, vínculo institucional, relação com profissional, inscrição em programa e permissões de comunicação. Encerrar uma relação não exclui Person, CareSubject, prontuário ou histórico.

O profissional autorizado poderá:
- silenciar notificações de uma conversa;
- configurar preferências e janelas de comunicação quando permitido;
- encaminhar mensagens para fila/equipe institucional;
- solicitar ou executar encerramento de vínculo conforme sua autoridade e política institucional;
- transferir o acompanhamento para outro profissional ou equipe;
- consultar histórico e documentos conforme permissões e obrigações de retenção.

**Silenciar** afeta notificações comuns para o profissional, não bloqueia recebimento institucional nem apaga mensagens. Alertas críticos e manifestações urgentes seguem regras de triagem/escalonamento definidas pela instituição, não podendo ser ocultados por uma preferência individual.

**Limitar comunicação** deve informar ao paciente canais, horários e alternativas institucionais, mantendo rota apropriada para situações urgentes. Não deve impedir acesso a documentos, solicitações formais ou direitos do paciente.

**Encerrar vínculo** exige motivo codificado e justificativa quando aplicável, autor, data/hora, escopo (profissional, equipe ou instituição), revisão/aprovação conforme política, comunicação ao paciente, orientação de continuidade/transição quando necessária e auditoria. Deve considerar tratamento em curso, risco, urgência, regras profissionais, contrato, base legal e normas de retenção. Não é mecanismo para abandono, retaliação, discriminação, supressão de registros ou evasão de responsabilidade.

O encerramento de vínculo profissional não encerra automaticamente vínculo institucional, outros profissionais, outros programas ou acesso legítimo do paciente aos próprios documentos. Reentrada exige novo vínculo ou reativação formal, sem apagar histórico.

## 30. Modular Commerce & Tysvora Store

Tysvora terá catálogo comercial nativo, dinâmico e administrável, denominado Tysvora Store. A instituição poderá consultar plano, franquias, adicionais e serviços elegíveis, contratar, ampliar acessos, acompanhar consumo, pagamentos e alterações de assinatura. O Control Center administra catálogo, preços, disponibilidade, planos, contratos, direitos, capacidade, assinaturas, cobrança, conciliação e políticas comerciais.

Planos iniciais de referência (estimativas, não preços aprovados/publicados): Start R$ 199/mês; Institution R$ 899/mês; Network R$ 3.990/mês; Public & Enterprise a partir de R$ 12.000/mês. Franquias de profissionais, administradores, unidades e capacidade serão definidas por plano. Pacientes não são cobrados individualmente. Acessos profissionais adicionais podem ser contratados; a métrica e o preço final dependem de validação econômica.

Adicionais de referência: UIP Advanced R$ 699/mês; Connector Agent adicional R$ 299/mês; Field Operations R$ 899/mês; Sentinela Intelligence R$ 699/mês; Advanced Analytics R$ 499/mês; Communication Hub R$ 249/mês; AI Services em pacotes a partir de R$ 99 ou consumo medido; Premium Support/SLA R$ 699/mês. Implantação assistida, integrações personalizadas e migração/saneamento são serviços separados, quando solicitados. Valores permanecem hipóteses comerciais de planejamento.

O modelo inclui Plan Catalog, Add-on Catalog, Subscription Management, Feature Entitlements, Capacity Entitlements, Provisioning Engine, Usage Metering, Billing & Invoicing, Payment Reconciliation, Contract Management, Entitlement Enforcement e Revenue Analytics. Direitos e limites são isolados por tenant/organização. Contratação gera assinatura, direito, capacidade, provisionamento e trilha auditável. Upgrade, downgrade, cancelamento, inadimplência, tolerância, renovação, reativação e excedentes têm políticas explícitas.

Programas e especialidades básicas não são vendidos como softwares separados. O preço não deve penalizar cadastro histórico de pacientes nem cobrar individualmente por cada mensagem clínica. Custos variáveis (IA, OCR, mensageria, áudio opcional e processamento) devem ter franquias, limites e medição transparentes.

A Tysvora Store não pode vender uma capacidade que não esteja implementada, homologada, provisionável, observável e economicamente dimensionada. A arquitetura pode prever funcionalidades futuras em estado indisponível/invernado, sem apresentá-las como prontas. Cobrança produtiva depende de provedor, reconciliação, testes financeiros, contratos, fiscalidade e aceite formal.

## 31. Central de Pendências Assistenciais e Operacionais

A Central de Pendências é a superfície unificada de execução para itens que exigem ação, originados por manifestações de pacientes, profissionais, programas, integrações, documentos, agenda, visitas, tarefas ou regras operacionais.

Cada item deve possuir: identidade e contexto relacionado; origem e proveniência; categoria; prioridade e justificativa; responsável atual; fila/equipe; prazo/SLA; estado e transições permitidas; próxima ação; histórico de atribuições; escalonamentos; resultado e motivo de encerramento. Deve suportar atribuição, aceite, transferência, pausa justificada, reabertura, escalonamento e encerramento auditáveis.

A Central não é uma caixa de notificações. Notificação informa; pendência representa trabalho que precisa de resolução. Mensagens, ocorrências clínicas, alertas e tarefas mantêm semânticas distintas, podendo originar ou atualizar uma pendência conforme política. Alertas críticos não podem ser ocultados por preferências comuns de comunicação. SLA e escalonamento são configuráveis por instituição, programa, categoria e criticidade; não substituem triagem ou prioridade clínica profissional.

## 32. Grafo de Contexto, Reconciliação e Qualidade dos Dados

O Tysvora deverá manter relações navegáveis e autorizadas entre Person/CareSubject, instituições, unidades, profissionais, vínculos, programas, jornadas, atendimentos, planos, ordens, prescrições, exames, documentos, manifestações, tarefas, visitas e desfechos.

O grafo é uma camada lógica de contexto, não uma autorização para exposição integral de dados. Toda consulta continua sujeita a tenant, instituição, finalidade, papel, vínculo e necessidade de acesso.

Reconciliação identifica divergências entre fontes e registros: medicamento, alergia, diagnóstico registrado, plano, documento, identificadores, dados cadastrais e outros atributos. Deve apresentar valores concorrentes, fonte, autoria, timestamp, confiança/qualidade e autoridade definida para o atributo. Nenhuma divergência relevante pode ser resolvida por sobrescrita silenciosa ou por escolha probabilística sem política aprovada e, quando necessário, revisão humana.

Preservar Source Data, Normalized Data e Canonical Domain Data, com lineage, transformações, proveniência, correções não destrutivas, deduplicação governada e possibilidade de desfazer vínculos incorretos. O grafo e a reconciliação dependem da UIP, do modelo de identidade e dos ADRs de domínio, segurança e persistência.

## 33. Sentinela — risco assistencial, continuidade e operação

Sentinela deverá distinguir explicitamente:
- **Sinais assistenciais:** manifestações ou padrões que requerem avaliação de profissional habilitado;
- **Riscos de continuidade:** ausência de retorno, abandono potencial, acompanhamento interrompido, plano sem revisão ou contato sem resposta;
- **Riscos operacionais:** fila, atraso, sobrecarga, tarefa sem responsável, falha de integração, unidade descoberta ou SLA vencido.

Cada sinal deve explicar regra/modelo, dados utilizados, fonte, atualização, limitações, destinatário, prioridade, versão e ação esperada. Deve medir falsos positivos/negativos quando aplicável, permitir contestação/correção e registrar desfecho. Sinais assistenciais não são diagnóstico, prognóstico nem decisão terapêutica. Ação clínica exige avaliação e autoridade profissional. Alertas operacionais podem criar pendências e acionar escalonamentos conforme política.

## 34. Biblioteca de Programas e Modelos Operacionais

O Program Engine poderá oferecer biblioteca versionada de modelos reutilizáveis para acelerar implantação: tabagismo, diabetes, hipertensão, saúde mental/depressão, obesidade, pré-natal, reabilitação, nutrição, cuidados paliativos, saúde da criança/idoso, doenças infecciosas e outros domínios, além de modelos veterinários quando aprovados.

Cada modelo poderá incluir elegibilidade, etapas, estados, formulários, instrumentos, metas, frequência, tarefas, papéis, mensagens, indicadores, critérios de conclusão e regras de encaminhamento. Instituições podem clonar/configurar modelos sem alterar a versão de origem. Conteúdo clínico, escalas, protocolos e recomendações exigem fonte, licença quando aplicável, versão, vigência, validação e aprovação por autoridade competente. A biblioteca não é um catálogo fechado nem transforma um modelo em protocolo universal.

## 35. Workforce Management — gestão da equipe institucional

O Tysvora deverá oferecer módulo institucional **Meus profissionais**, com visão da equipe clínica, administrativa e operacional: médicos, enfermagem, técnicos, psicólogos, nutricionistas, fisioterapeutas, veterinários, recepção, coordenação, administração, agentes comunitários, equipes de campo e outras funções.

Capacidades previstas:
- cadastro e vínculo institucional, funções, especialidades, credenciais/habilitações, unidades, equipes e status;
- jornada prevista, carga horária, turnos, intervalos, escalas, plantões e cobertura;
- férias, folgas, licenças, afastamentos, atestados, solicitações e aprovações;
- registros de jornada, banco de horas, créditos, débitos, compensações e ajustes autorizados;
- atividades, atendimentos, visitas, tarefas e atribuições;
- conflitos de escala, indisponibilidade, substituição e redistribuição assistida;
- indicadores de disponibilidade, cobertura, carga, ocupação, atrasos e distribuição de atividades;
- autoatendimento do colaborador para consultar informações e solicitar férias, folgas, troca de turno, ajuste de jornada e atualização cadastral.

Modelo de domínio deve separar Person, UserIdentity, Professional, WorkforceMember/StaffMember, InstitutionalEmployment/Engagement, RoleAssignment, Credential, WorkSchedule, Shift, LeaveRequest, Absence, TimeEntry, TimeBalance, ActivityRecord e CoverageRequirement. Nem todo colaborador é profissional de saúde; nem todo profissional é empregado; uma pessoa pode ter múltiplos vínculos, funções e unidades. A autorização clínica e as permissões administrativas são independentes da gestão de jornada.

Dados de atestados e afastamentos exigem minimização e acesso restrito: gestores de escala recebem somente a informação necessária para cobertura; conteúdo clínico do documento não fica amplamente disponível. Registros de jornada, banco de horas e licenças devem respeitar legislação, contratos, acordos coletivos e jurisdição. O módulo não será apresentado como folha de pagamento, sistema jurídico-trabalhista ou RH completo. Integração com ponto/folha é preferível quando o escopo regulatório e contratual exigir.

## 36. Capacity Engine e coordenação da força de trabalho

Capacity Engine correlaciona demanda assistencial/operacional com disponibilidade, competência, habilitação, unidade, território, agenda, jornada, carga e restrições. Deve apoiar dimensionamento, detecção de gargalos, distribuição de filas, planejamento de cobertura, combinação de visitas por região e análise de modalidades remota/presencial quando clinicamente autorizadas.

Pode sugerir redistribuição e cenários, mas atribuição de responsabilidade clínica, prioridade assistencial e alterações sensíveis de escala exigem aprovação humana conforme política. Segurança, competência, descanso, limites de jornada e adequação do cuidado prevalecem sobre produtividade ou receita. Não usar contagem bruta de atendimentos como ranking individual de qualidade.

Indicadores possíveis: tempo para recuperar contexto; tempo até primeira resposta; tempo até resolução; pendências abertas/vencidas; carga por função/equipe/unidade; cobertura; horas disponíveis/realizadas; continuidade; visitas planejadas/concluídas; retrabalho; capacidade utilizada; custo por jornada. Economia, produtividade ou ganho de capacidade só podem ser divulgados após piloto com baseline, método, período, custos e limitações documentados.

## 37. Internacionalização, localização e conteúdo multilíngue

A plataforma deverá ser internacionalizável desde a fundação, iniciando por português brasileiro (pt-BR) e inglês (en), com possibilidade de variantes regionais. O idioma é uma preferência por usuário, com defaults institucionais e de organização; a preferência individual pode diferir do idioma da instituição e do idioma escolhido para comunicação com o paciente.

Separar:
- tradução de interface e mensagens de sistema;
- conteúdo institucional;
- conteúdo de programas, formulários e protocolos;
- idioma de comunicação preferido por pessoa;
- idioma original de documentos e registros;
- tradução derivada, identificada como tradução, com autoria/origem, data, método, versão e possibilidade de revisão.

Preservar sempre o conteúdo original. Tradução automática não altera o registro clínico original nem substitui documento legalmente válido. Documentos regulados, prescrições, consentimentos e orientações clínicas devem exibir idioma, versão e status; tradução não certificada deve ser claramente marcada e não apresentada como original. Localização abrange datas, horários, calendários, números, moedas, unidades, fuso horário, formatos e regras regionais. Internacionalização técnica não equivale a autorização para operar em outro país: cada jurisdição exige análise legal, regulatória, fiscal, de privacidade, terminologia e interoperabilidade.

## 38. Copiloto Operacional e IA Assistiva

O AI Gateway poderá disponibilizar copiloto para resumir contexto autorizado, organizar conversas em eventos estruturados, extrair dados de documentos, preparar rascunhos, localizar informação, resumir filas e sugerir tarefas administrativas. Saídas devem indicar fontes, incerteza e limites, ser revisáveis e registrar modelo/prompt/política quando necessário.

IA prepara, organiza e sinaliza; profissional ou colaborador autorizado valida e executa. Não diagnostica, prescreve, altera plano, encerra ocorrência clínica ou toma decisão de alocação clínica autônoma. Dados sensíveis exigem minimização, finalidade, retenção e provedor aprovados. Avaliação de qualidade, vieses, prompt injection, segurança, fallback, custo e supervisão são gates obrigatórios.

## 39. Experiência longitudinal e transparência do paciente

Tysvora Patient deverá permitir, conforme autorização institucional e direitos aplicáveis, visualizar programas ativos, metas, orientações vigentes, compromissos, documentos, solicitações, pendências atribuídas ao paciente e evolução compartilhável. Deve distinguir informação registrada por profissional, informação autorrelatada e dado importado. O paciente participa da continuidade, mas não recebe responsabilidade por decisões clínicas ou pela coordenação institucional.

## 40. Princípios de composição e limites de escopo

As capacidades descritas nos §§31–39 reutilizam Core, UIP, Program Engine, Workflow/Task, Communication, Security, Audit, Analytics e Control Center. Não criar cadastros de identidade, notificações, tarefas, permissões, auditoria ou catálogos paralelos. Engines são fronteiras de responsabilidade, não exigência automática de microserviços.

O Tysvora pode oferecer gestão operacional da força de trabalho, mas não se transforma automaticamente em ERP de RH, folha, contabilidade ou sistema jurídico-trabalhista. Deve integrar fornecedores especializados quando necessário. Toda capacidade permanece PLANEJADA até implementação, homologação e evidência documentada.
